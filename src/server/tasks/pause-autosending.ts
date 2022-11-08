import type { Task } from "graphile-worker";

import { DateTime, parseIanaZone } from "../../lib/datetime";
import { timezones } from "../../lib/timezones";
import type { CampaignRecord } from "../api/types";
import { r } from "../models";
import { TASK_IDENTIFIER as retryInteractionStepIdentifier } from "./retry-interaction-step";

export const UNQUEUE_AUTOSENDING_MESSAGES_TASK_IDENTIFIER =
  "unqueue-autosending-messages";

export const PAUSE_AUTOSENDING_CAMPAIGNS_TASK_IDENTIFIER =
  "pause-autosending-campaigns";

const TIMEZONES = timezones.map((tz: string) => parseIanaZone(tz));

const getAutosendingCampaigns = async (): Promise<Array<CampaignRecord>> =>
  r.knex("all_campaign").where({ autosend_status: "sending" });

const getMessagesCount = async (campaignId: number) =>
  r
    .knex("graphile_worker.jobs")
    .where({
      task_identifier: retryInteractionStepIdentifier
    })
    .whereRaw("payload->>'campaignId' = ?", [campaignId])
    .count("id")
    .first();

// Get Array of [tz, texting_hours_end] for whereIn query
// DateTime end of hour takes us to the last second
// add a minute to change time to next hour, and get the hour value
const getHoursWithTimezones = () =>
  TIMEZONES.map((tz: string) => [
    tz,
    DateTime.now().setZone(tz).endOf("hour").plus({ minutes: 1 }).hour
  ]);

const getAutosendingContacts = async (campaigns: Array<CampaignRecord>) => {
  const campaignIds = campaigns.map((c: CampaignRecord) => c.id);
  const timeZoneParams = getHoursWithTimezones();

  const contactsToUnqueueWithTimezone = await r
    .knex("campaign_contact")
    .join("campaign", "campaign.id", "campaign_contact.campaign_id")
    .where({ message_status: "needsMessage" })
    .whereIn("campaign.id", campaignIds)
    .whereIn(
      ["campaign_contact.timezone", "campaign.texting_hours_end"],
      timeZoneParams
    )
    .pluck("campaign_contact.id");

  const contactsToUnqueueWithoutTimezone = await r
    .knex("campaign_contact")
    .join("campaign", "campaign.id", "campaign_contact.campaign_id")
    .where({
      "campaign_contact.timezone": null,
      message_status: "needsMessage"
    })
    .whereIn("campaign.id", campaignIds)
    .whereIn(
      ["campaign.timezone", "campaign.texting_hours_end"],
      timeZoneParams
    )
    .pluck("campaign_contact.id");

  return contactsToUnqueueWithTimezone.concat(contactsToUnqueueWithoutTimezone);
};

export const unqueueAutosendingMessages: Task = async (_payload, _helpers) => {
  const campaigns = await getAutosendingCampaigns();
  const contacts = await getAutosendingContacts(campaigns);

  await r
    .knex("graphile_worker.jobs")
    .where({ task_identifier: retryInteractionStepIdentifier })
    .whereRaw("payload->>'campaignContactId' = ANY(?)", [contacts])
    .delete();
};

export const pauseAutosendingCampaigns: Task = async (_payload, _helpers) => {
  const runningCampaigns = await getAutosendingCampaigns();

  const campaignsToPause = [];
  for (const campaign of runningCampaigns) {
    const { count: messagesToSend } = await getMessagesCount(campaign.id);

    if (messagesToSend === 0) {
      campaignsToPause.push(campaign.id);
    }
  }

  await r
    .knex("campaign")
    .whereIn("id", campaignsToPause)
    .update({ autosend_status: "paused" });
};
