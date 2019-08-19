import { config } from "../../../config";
import logger from "../../../logger";
import { r } from "../../models";
import _ from "lodash";
import request from "superagent";
import { PlacesAllInclusive } from "material-ui/svg-icons";

const THRESHOLD = 0.2;

async function checkForBadDeliverability() {
  if (config.DELIVERABILITY_ALERT_ENDPOINT === undefined) return null;
  logger.info("Running deliverability check");
  /*
    find domains that have been sent on in the past hour that
      - have more than 1000 sends over the past 2 days
      - had deliverability less than 80%
  */
  const results = await r.knex.raw(`
    with domains_sent_on_within_last_hour as (
      select domain
      from link_domain
      join message as link_message
        on link_message.text like '%' || link_domain.domain || '%'
      where link_message.created_at > now() - interval '1 hours' 
    )
    select domain, send_status, count(*)
    from domains_sent_on_within_last_hour
    join message as link_message
      on link_message.text like '%' || domains_sent_on_within_last_hour.domain || '%'
    where link_message.created_at > now() - interval '2 days' 
    group by domain, link_message.send_status;
  `);

  const byDomain = _.groupBy(results.rows, x => x.domain);

  for (let domain of Object.keys(byDomain)) {
    const fetchCountBySendStatus = status => {
      for (let foundStatus of byDomain[domain]) {
        if (foundStatus.send_status == status) {
          return foundStatus.count;
        }
      }
      return 0;
    };

    const deliveredCount = fetchCountBySendStatus("DELIVERED");
    const sentCount = fetchCountBySendStatus("SENT");
    const errorCount = fetchCountBySendStatus("ERROR");

    const errorPercent = errorCount / (deliveredCount + sentCount);
    if (errorPercent > THRESHOLD) {
      logger.info(
        `Sending deliverability alert to ${
          config.DELIVERABILITY_ALERT_ENDPOINT
        } because ${domain} is sending at ${errorPercent}`
      );

      await request
        .post(config.DELIVERABILITY_ALERT_ENDPOINT)
        .send({ domain, errorPercent });
    }
  }
}

async function notifyOnTagConversation(campaignContactId, userId, webhookUrls) {
  const promises = {
    mostRecentlyReceivedMessage: (async () => {
      const message = await r
        .knex("message")
        .where({
          campaign_contact_id: parseInt(campaignContactId),
          is_from_contact: true
        })
        .orderBy("created_at", "desc")
        .first("*");

      return message;
    })(),
    taggingUser: (async () => {
      const user = await r
        .knex("user")
        .where({ id: parseInt(userId) })
        .first("*");

      return user;
    })(),
    taggedContact: (async () => {
      const contact = await r
        .knex("campaign_contact")
        .where({ id: parseInt(campaignContactId) })
        .first("*");

      return contact;
    })()
  };

  const [
    mostRecentlyReceivedMessage,
    taggingUser,
    taggedContact
  ] = await Promise.all([
    promises.mostRecentlyReceivedMessage,
    promises.taggingUser,
    promises.taggedContact
  ]);

  await Promise.all(
    webhookUrls.map(url =>
      request
        .post(url)
        .send({ mostRecentlyReceivedMessage, taggingUser, taggedContact })
    )
  );
}

export { checkForBadDeliverability, notifyOnTagConversation };
