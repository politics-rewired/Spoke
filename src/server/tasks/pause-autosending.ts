import type { Task } from "graphile-worker";

import { DateTime, parseIanaZone } from "../../lib/datetime";
import { timezones } from "../../lib/timezones";
import type { CampaignRecord } from "../api/types";
import { r } from "../models";

export const PAUSE_AUTOSENDING_CAMPAIGNS_TASK_IDENTIFIER =
  "pause-autosending-campaigns";

const TIMEZONES = timezones.map((tz: string) => parseIanaZone(tz));

const getAutosendingCampaigns = async (): Promise<Array<CampaignRecord>> =>
  r.knex("all_campaign").where({ autosend_status: "sending" });

// Get Array of [tz, tz_next_hour] for whereIn query
// DateTime end of hour takes us to the last second
// add a minute to change time to next hour, and get the hour value
const getTimezonesWithHours = () =>
  TIMEZONES.map((tz: string) => [
    tz,
    DateTime.now().setZone(tz).startOf("hour").hour
  ]);

const getElligibleContactsCount = async (campaign: CampaignRecord) => {
  const timeZoneParams = getTimezonesWithHours();

  const [{ count: contactsWithTimezoneCount }] = await r
    .knex("campaign_contact")
    .join("campaign", "campaign.id", "campaign_contact.campaign_id")
    .where({ message_status: "needsMessage", campaign_id: campaign.id })
    .whereNotNull("campaign_contact.timezone")
    .whereNotIn(
      ["campaign_contact.timezone", "campaign.texting_hours_end"],
      timeZoneParams
    )
    .count("campaign_contact.id");

  const [{ count: contactsWithoutTimezoneCount }] = await r
    .knex("campaign_contact")
    .join("campaign", "campaign.id", "campaign_contact.campaign_id")
    .where({
      "campaign_contact.timezone": null,
      message_status: "needsMessage",
      campaign_id: campaign.id
    })
    .whereNotIn(
      ["campaign.timezone", "campaign.texting_hours_end"],
      timeZoneParams
    )
    .count("campaign_contact.id");

  return (
    Number(contactsWithTimezoneCount) + Number(contactsWithoutTimezoneCount)
  );
};

export const pauseAutosendingCampaigns: Task = async (_payload, _helpers) => {
  const runningCampaigns = await getAutosendingCampaigns();

  const campaignsToPause = [];
  for (const campaign of runningCampaigns) {
    const elligibleContactsCount = await getElligibleContactsCount(campaign);

    if (elligibleContactsCount === 0) {
      campaignsToPause.push(campaign.id);
    }
  }

  await r
    .knex("all_campaign")
    .whereIn("id", campaignsToPause)
    .update({ autosend_status: "paused" });
};
