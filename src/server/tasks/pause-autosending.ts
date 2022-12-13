import type { Task } from "graphile-worker";

import type { CampaignRecord } from "../api/types";
import { r } from "../models";

export const PAUSE_AUTOSENDING_CAMPAIGNS_TASK_IDENTIFIER =
  "pause-autosending-campaigns";

const getAutosendingCampaigns = async (): Promise<Array<CampaignRecord>> =>
  r
    .knex("all_campaign")
    .where({ autosend_status: "sending", is_archived: false });

const getElligibleContactsCount = async (campaign: CampaignRecord) => {
  const { rows: elligibleContactsCountRows } = await r.knex.raw(
    `
      select count(cc.id)
      from campaign_contact cc
      join campaign c on cc.campaign_id = c.id
      where c.id = ?
      and (
        ( cc.timezone is null
          and extract(hour from CURRENT_TIMESTAMP at time zone c.timezone) < c.texting_hours_end
          and extract(hour from CURRENT_TIMESTAMP at time zone c.timezone) >= c.texting_hours_start
        )
        or
        ( c.texting_hours_end > extract(hour from (CURRENT_TIMESTAMP at time zone cc.timezone) + interval '10 minutes')
           and c.texting_hours_start <= extract(hour from (CURRENT_TIMESTAMP at time zone cc.timezone ))
        )
      )
    `,
    [campaign.id]
  );

  return Number(elligibleContactsCountRows[0].count);
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
