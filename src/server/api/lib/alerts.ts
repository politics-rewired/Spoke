import _ from "lodash";
import request from "superagent";

import { config } from "../../../config";
import logger from "../../../logger";
import { r } from "../../models";
import { MessageSendStatus } from "../types";

const THRESHOLD = 0.2;

interface NotifyAssignmentCreatedOptions {
  organizationId: number;
  userId: number;
  count: number;
}

type NotifyAssignmentCreatedPayload = {
  organizationId: number | string;
  organizationName: string;
  count: number | string;
  email: string;
  externalUserId?: number | string;
};

export const notifyAssignmentCreated = async (
  options: NotifyAssignmentCreatedOptions
) => {
  const { organizationId, userId, count } = options;

  if (!config.ASSIGNMENT_REQUESTED_URL) return;

  const { auth0_id: externalUserId, email } = await r
    .reader("user")
    .where({ id: userId })
    .first(["auth0_id", "email"]);

  const { name: organizationName } = await r
    .reader("organization")
    .where({ id: organizationId })
    .first(["name"]);

  let payload: NotifyAssignmentCreatedPayload = {
    organizationId,
    organizationName,
    count,
    email
  };

  if (["slack"].includes(config.PASSPORT_STRATEGY)) {
    payload.externalUserId = externalUserId;
  }

  if (config.WEBHOOK_PAYLOAD_ALL_STRINGS) {
    payload = Object.fromEntries(
      Object.entries(payload).map(([key, value]) => [key, `${value}`])
    ) as NotifyAssignmentCreatedPayload;
  }

  const webhookRequest = request
    .post(config.ASSIGNMENT_REQUESTED_URL)
    .timeout(30000);

  if (config.ASSIGNMENT_REQUESTED_TOKEN) {
    webhookRequest.set(
      "Authorization",
      `Token ${config.ASSIGNMENT_REQUESTED_TOKEN}`
    );
  }

  return webhookRequest.send(payload).catch((err) => {
    logger.error("Error sending assignment requested webhook: ", err);
    throw err;
  });
};

type DeliverabilityRow = {
  domain: string;
  send_status: MessageSendStatus;
  count: number;
};

export async function checkForBadDeliverability() {
  if (config.DELIVERABILITY_ALERT_ENDPOINT === undefined) return null;
  logger.info("Running deliverability check");
  /*
    find domains that have been sent on in the past hour that
      - have more than 1000 sends over the past 2 days
      - had deliverability less than 80%
  */
  const results = await r.reader.raw(`
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

  const byDomain = _.groupBy(
    results.rows as DeliverabilityRow[],
    (x) => x.domain
  );

  for (const domain of Object.keys(byDomain)) {
    const fetchCountBySendStatus = (status: string) => {
      for (const foundStatus of byDomain[domain]) {
        if (foundStatus.send_status === status) {
          return foundStatus.count;
        }
      }
      return 0;
    };

    const deliveredCount = fetchCountBySendStatus(MessageSendStatus.Delivered);
    const sentCount = fetchCountBySendStatus(MessageSendStatus.Sent);
    const errorCount = fetchCountBySendStatus(MessageSendStatus.Error);

    const errorPercent = errorCount / (deliveredCount + sentCount);
    if (errorPercent > THRESHOLD) {
      logger.info(
        `Sending deliverability alert to ${config.DELIVERABILITY_ALERT_ENDPOINT} because ${domain} is sending at ${errorPercent}`
      );

      await request
        .post(config.DELIVERABILITY_ALERT_ENDPOINT)
        .send({ domain, errorPercent });
    }
  }
}

export async function notifyOnTagConversation(
  campaignContactId: string,
  userId: string,
  webhookUrls: string[]
) {
  const promises = {
    mostRecentlyReceivedMessage: (async () => {
      const message = await r
        .reader("message")
        .where({
          campaign_contact_id: parseInt(campaignContactId, 10),
          is_from_contact: true
        })
        .orderBy("created_at", "desc")
        .first("*");

      return message;
    })(),
    taggingUser: (async () => {
      const user = await r
        .reader("user")
        .where({ id: parseInt(userId, 10) })
        .first("*");

      return user;
    })(),
    taggedContact: (async () => {
      const contact = await r
        .reader("campaign_contact")
        .where({ id: parseInt(campaignContactId, 10) })
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

  const taggedCampaign = await r
    .reader("campaign")
    .where({ id: taggedContact.campaign_id })
    .first("*");

  await Promise.all(
    webhookUrls.map((url) =>
      request
        .post(url)
        .timeout(30000)
        .send({
          mostRecentlyReceivedMessage,
          taggingUser,
          taggedContact,
          taggedCampaign
        })
        .catch((err) =>
          logger.error("Encountered error notifying on tag assignment: ", err)
        )
    )
  );
}

export async function notifyLargeCampaignEvent(
  campaignId: number,
  event: "upload" | "start",
  threshold = config.LARGE_CAMPAIGN_THRESHOLD,
  url = config.LARGE_CAMPAIGN_WEBHOOK
) {
  if (!url) return;

  const campaignInfo = await r
    .knex("campaign")
    .join("organization", "organization.id", "=", "campaign.organization_id")
    .where({ "campaign.id": campaignId })
    .first([
      "organization.id as org_id",
      "organization.name as org_name",
      "campaign.id as campaign_id",
      "campaign.title as campaign_title"
    ]);

  const [{ count }] = await r
    .knex("campaign_contact")
    .where({ campaign_id: campaignId })
    .count("id");

  if (count < threshold) return;

  const payload = {
    instance: config.BASE_URL,
    organizationId: campaignInfo.org_id,
    organizationName: campaignInfo.org_name,
    campaignId,
    campaignTitle: campaignInfo.campaign_title,
    campaignUrl: `${config.BASE_URL}/admin/${campaignInfo.org_id}/campaigns/${campaignId}`,
    event,
    contactCount: count
  };

  await request.post(url).send(payload);
}
