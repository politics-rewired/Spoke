try {
  require("dotenv").config();
} catch (ex) {
  // do nothing
}

const config = {
  client: "mysql",
  connection: process.env.DATABASE_URL,
  pool: {
    min: 2,
    max: 10
  }
};

const moment = require("moment");
const MINUTES_LATER = 10;
const COMPUTATION_DELAY = 1;

const DOMAIN_ENDINGS = [".com", ".us", ".net", ".io", ".org", ".info", ".news"];
const DOMAIN_REGEX = new RegExp(
  `[^://\\s]*` + "(" + DOMAIN_ENDINGS.map(tld => `\\${tld}`).join("|") + ")"
);

const db = require("knex")(config);

async function main() {
  const results = await db.raw(`
    select DATE_FORMAT(period_ends_at, '%Y-%m-%dT%H:%i:%SZ') as period_ends_at
    from deliverability_report
    order by period_ends_at desc
    limit 1
  `);

  const lastReport = results[0][0];

  let period_starts_at, period_ends_at;

  if (lastReport) {
    period_starts_at = lastReport.period_ends_at;
  } else {
    period_starts_at = await firstMessageSentAt();
  }

  period_starts_at = moment.utc(period_starts_at);
  period_ends_at = moment.utc(period_starts_at);
  period_ends_at.add(MINUTES_LATER, "minutes");

  let nMinutesAgo = moment.utc();
  nMinutesAgo = nMinutesAgo.subtract(MINUTES_LATER + COMPUTATION_DELAY);

  if (nMinutesAgo.isBefore(period_ends_at)) {
    console.log(
      "Too early to compute report for period ending at",
      period_ends_at
    );
    return "Done";
  }

  const messages = await db("message")
    .select("text", "send_status")
    .where({ is_from_contact: false })
    .where("created_at", ">=", period_starts_at.toISOString())
    .where("created_at", "<=", period_ends_at.toISOString());

  const messageItems = messages.map(m => {
    const domain = extractDomain(m.text);
    const url_path = extractPath(m.text, domain);

    return {
      send_status: m.send_status,
      domain: domain,
      url_path: url_path
    };
  });

  const grouped = {};
  messageItems.forEach(mi => {
    const key = JSON.stringify({ domain: mi.domain, url_path: mi.url_path });

    if (!grouped[key]) {
      grouped[key] = {
        total: 0,
        sent: 0,
        delivered: 0,
        error: 0
      };
    }

    grouped[key].total++;
    grouped[key][mi.send_status.toLowerCase()]++;
  });

  const rows = Object.keys(grouped).map(key => {
    const vals = JSON.parse(key);
    return {
      ...vals,
      computed_at: db.fn.now(),
      period_starts_at: period_starts_at.toISOString(),
      period_ends_at: period_ends_at.toISOString(),
      count_total: grouped[key].total,
      count_delivered: grouped[key].delivered,
      count_sent: grouped[key].sent,
      count_error: grouped[key].error
    };
  });

  if (rows.length == 0) {
    rows.push({
      domain: null,
      url_path: null,
      computed_at: db.fn.now(),
      period_starts_at: period_starts_at.toISOString(),
      period_ends_at: period_ends_at.toISOString(),
      count_total: 0,
      count_delivered: 0,
      count_sent: 0,
      count_error: 0
    });
  }

  const insertResult = await db("deliverability_report").insert(rows);
  console.log("Successfully inserted with value: ", insertResult);
  return main();
}

async function firstMessageSentAt() {
  const firstMessage = await db("message")
    .select("created_at")
    .orderBy("created_at", "asc")
    .limit(1)
    .first();

  return firstMessage ? firstMessage.created_at : firstMessage;
}

function extractDomain(text) {
  const matches = text.match(DOMAIN_REGEX);
  return matches ? matches[0] : null;
}

function extractPath(text, domain) {
  if (!domain) return null;

  try {
    const fullUrlRegex = new RegExp(domain + `\\S*`);
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

main()
  .then(result => {
    console.log(result);
    process.exit();
  })
  .catch(error => {
    console.error(error);
    process.exit();
  });
