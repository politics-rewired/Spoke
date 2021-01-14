import knex from "knex";
import _ from "lodash";
import groupBy from "lodash/groupBy";

import { DateTime, Interval } from "../../lib/datetime";
import { asUtc } from "../../lib/tz-helpers";
import logger from "../../logger";
import knexConfig from "../../server/knex";

const MINUTES_LATER = 10;
const COMPUTATION_DELAY = 1;

const SENSOR_DOMAIN_MAX_THRESHOLD = 10;
const SLIDING_WINDOW_SECONDS = 4 * 60 * 60; // 4 hours
// eslint-disable-next-line no-unused-vars,@typescript-eslint/no-unused-vars
const COOL_DOWN_PERIOD_SECONDS = 7 * 24 * 60 * 60; // 7 days

const DOMAIN_ENDINGS = [".com", ".us", ".net", ".io", ".org", ".info", ".news"];
const DOMAIN_REGEX = new RegExp(
  `${`[^://\\s]*(`}${DOMAIN_ENDINGS.map((tld) => `\\${tld}`).join("|")})`
);

const db = knex(knexConfig);

async function markDomainUnhealthy(domain: string) {
  // Check if domain is already marked unhealthy
  const existingDomain = await db("unhealthy_link_domain")
    .select("id")
    .where({ domain })
    .where("healthy_again_at", ">", db.fn.now())
    .orWhereNull("healthy_again_at")
    .first();

  if (existingDomain) {
    logger.verbose(`Found existing unhealthy record for domain ${domain}`);
    return;
  }

  logger.warn(`Marking ${domain} as unhealthy.`);
  await db("unhealthy_link_domain").insert({ domain });
}

async function firstMessageSentAt() {
  const firstMessage = await db("message")
    .select("created_at")
    .orderBy("created_at", "asc")
    .limit(1)
    .first();

  return firstMessage ? firstMessage.created_at : firstMessage;
}

function extractDomain(text: string) {
  const matches = text.match(DOMAIN_REGEX);
  return matches ? matches[0] : null;
}

function extractPath(text: string, domain: string | null) {
  if (!domain) return null;

  try {
    const fullUrlRegex = new RegExp(`${domain}\\S*`);
    const matches = text.match(fullUrlRegex);
    const fullUrl = matches ? matches[0] : null;

    if (!fullUrl) return null;

    const splitBySlash = fullUrl.split("/");
    const fullPath = splitBySlash.slice(1, 10000).join("/");
    return fullPath;
  } catch (ex) {
    return null;
  }
}

async function chunkedMain(): Promise<"Done"> {
  const results = await db.raw(`
    select (to_char(period_ends_at, 'YYYY-MM-DD') || 'T' || to_char(period_ends_at, 'HH24:MI:SSZ')) as period_ends_at
    from deliverability_report
    order by period_ends_at desc
    limit 1
  `);

  const lastReport = results.rows[0];

  const period = Interval.after(
    asUtc(lastReport ? lastReport.period_ends_at : await firstMessageSentAt()),
    { minutes: MINUTES_LATER }
  );

  if (
    period.contains(
      DateTime.utc().minus({
        minutes: MINUTES_LATER + COMPUTATION_DELAY
      })
    )
  ) {
    logger.verbose(
      "Too early to compute report for period ending at",
      period.end.toISO()
    );
    return DONE;
  }

  const messages = await db("message")
    .select("text", "send_status")
    .where({ is_from_contact: false })
    .where("created_at", ">=", period.start.toISO())
    .where("created_at", "<=", period.end.toISO());

  const messageItems = messages.map((m) => {
    const domain = extractDomain(m.text);
    const url_path = extractPath(m.text, domain);

    return {
      send_status: m.send_status,
      domain,
      url_path
    };
  });

  const grouped = {};
  messageItems.forEach((mi) => {
    const key = JSON.stringify({ domain: mi.domain, url_path: mi.url_path });

    if (!grouped[key]) {
      grouped[key] = {
        total: 0,
        sent: 0,
        delivered: 0,
        error: 0
      };
    }

    grouped[key].total += 1;
    grouped[key][mi.send_status.toLowerCase()] += 1;
  });

  const rows = Object.keys(grouped).map((key) => {
    const vals = JSON.parse(key);
    return {
      ...vals,
      computed_at: db.fn.now(),
      period_starts_at: period.start.toISO(),
      period_ends_at: period.end.toISO(),
      count_total: grouped[key].total,
      count_delivered: grouped[key].delivered,
      count_sent: grouped[key].sent,
      count_error: grouped[key].error
    };
  });

  if (rows.length === 0) {
    rows.push({
      domain: null,
      url_path: null,
      computed_at: db.fn.now(),
      period_starts_at: period.start.toISO(),
      period_ends_at: period.end.toISO(),
      count_total: 0,
      count_delivered: 0,
      count_sent: 0,
      count_error: 0
    });
  }

  const insertResult = await db("deliverability_report").insert(rows);
  logger.verbose("Successfully inserted with value: ", insertResult);
  return chunkedMain();
}

const deliverabilityReducer = (accumulator, messageGroup) => {
  let [sent, delivered] = accumulator;
  sent += messageGroup.message_count;
  if (messageGroup.send_status.toLowerCase === "delivered")
    delivered += messageGroup.message_count;
  return [sent, delivered];
};

async function slidingWindowMain() {
  const { rows: messages } = await db.raw(
    `
    select
      count(*)::integer as message_count,
      matched_message.send_status,
      matched_message.domain,
      (link_domain.max_usage_count <= ?) as is_sensor_domain
    from
      link_domain
      join
        (
          select
            send_status,
            lower(substring(text from '.*://([^/]*)')) as domain
          from
            message
          where
            created_at >= CURRENT_TIMESTAMP - INTERVAL '?? second'
            and text like '%http%'
        ) as matched_message
        on matched_message.domain = link_domain.domain
    group by
      matched_message.send_status,
      matched_message.domain,
      is_sensor_domain
  `,
    [SENSOR_DOMAIN_MAX_THRESHOLD, SLIDING_WINDOW_SECONDS]
  );

  const sensorDomainMessages = messages.filter(
    (message) => message.is_sensor_domain
  );
  const [
    sensorSent,
    sensorDelivered
  ] = sensorDomainMessages.reduce(deliverabilityReducer, [0, 0]);
  const sensorDeliverability = sensorDelivered / Math.max(1, sensorSent);

  const workHorseDomains = messages.filter(
    (message) => !message.is_sensor_domain
  );
  const messageGroupsByDomain = groupBy(
    workHorseDomains,
    (message) => message.domain
  );
  const domainDeliverability = Object.keys(messageGroupsByDomain).reduce(
    (accumulator, domain) => {
      const messageGroups = messageGroupsByDomain[domain];
      const [sent, delivered] = messageGroups.reduce(deliverabilityReducer, [
        0,
        0
      ]);
      accumulator[domain] = delivered / Math.max(1, sent);
      return accumulator;
    },
    {}
  );

  await Promise.all(
    Object.keys(domainDeliverability).map(async (domain) => {
      const deliverability = domainDeliverability[domain];
      if (deliverability < sensorDeliverability - 0.3) {
        logger.warn(
          `Domain '${domain}' deemed unhealthy with deliverability ${deliverability} over the last ${
            SLIDING_WINDOW_SECONDS / 60 / 60
          } hours`
        );
        await markDomainUnhealthy(domain);
      }
    })
  );

  // TODO - re-introduce unhealthy domains after a cool down period
  // await db('unhealthy_link_domain')
  //   .update({ healthy_again_at: db.fn.now() })
  //   .whereNull('healthy_again_at')
  //   .whereRaw(`created_at < CURRENT_TIMESTAMP - INTERVAL '?? second'`, [COOL_DOWN_PERIOD_SECONDS])

  return "Done";
}

async function main() {
  return Promise.all([chunkedMain(), slidingWindowMain()]);
}

main()
  .then((result) => {
    logger.info(result);
    process.exit(0);
  })
  .catch((error) => {
    logger.error("Error creating deliverability report: ", error);
    process.exit(1);
  });
