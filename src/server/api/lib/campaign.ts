/* eslint-disable import/prefer-default-export */
import isNil from "lodash/isNil";
import { QueryResult } from "pg";

import { Campaign, CampaignsFilter } from "../../../api/campaign";
import { RelayPaginatedResponse } from "../../../api/pagination";
import { makeTree } from "../../../lib";
import { SpokeDbContext } from "../../contexts";
import { cacheOpts, memoizer } from "../../memoredis";
import { r } from "../../models";
import { CampaignRecord, InteractionStepRecord } from "../types";
import { persistInteractionStepTree } from "./interaction-steps";
import { formatPage } from "./pagination";

interface GetCampaignsOptions {
  first?: number;
  after?: string;
  filter?: CampaignsFilter;
}

type DoGetCampaigns = (
  options: GetCampaignsOptions
) => Promise<RelayPaginatedResponse<Campaign>>;

export const getCampaigns: DoGetCampaigns = memoizer.memoize(
  async (options: GetCampaignsOptions) => {
    const { after, first, filter = {} } = options;
    const { organizationId, campaignId, isArchived } = filter || {};

    const query = r.reader("campaign").select("*");

    // Filter options
    if (organizationId) {
      query.where({ organization_id: organizationId });
    }

    if (campaignId) {
      query.where({ id: campaignId });
    }

    if (!isNil(isArchived)) {
      query.where({ is_archived: isArchived });
    }

    const pagerOptions = { first, after };
    return formatPage(query, pagerOptions);
  },
  cacheOpts.CampaignsListRelay
);

interface DeliverabilityStatRow {
  count: string;
  send_status: string;
  error_codes: string[] | null;
}

export const getDeliverabilityStats = async (campaignId: number) => {
  const rows = await r.reader
    .raw(
      `
        select count(*), send_status, coalesce(error_codes, '{}') as error_codes
        from message
        join campaign_contact on campaign_contact.id = message.campaign_contact_id
        where campaign_contact.campaign_id = ?
          and is_from_contact = false
        group by 2, 3
      `,
      [campaignId]
    )
    .then((res: { rows: DeliverabilityStatRow[] }) => {
      // The `count` column is returned as a string so we parse it ourselves
      return res.rows.map(({ count, ...row }) => ({
        ...row,
        count: parseInt(count, 10)
      }));
    });

  const result = {
    deliveredCount: rows.find((o) => o.send_status === "DELIVERED")?.count || 0,
    sendingCount: rows.find((o) => o.send_status === "SENDING")?.count || 0,
    sentCount: rows.find((o) => o.send_status === "SENT")?.count || 0,
    errorCount:
      rows
        .filter((o) => o.send_status === "ERROR")
        .reduce((a, b) => ({ count: a.count + b.count }), { count: 0 }).count ||
      0,
    specificErrors: rows
      .filter((o) => o.send_status === "ERROR")
      .map((o) => ({
        errorCode:
          o.error_codes && o.error_codes.length > 0 ? o.error_codes[0] : null,
        count: o.count
      }))
  };

  return result;
};

export interface CopyCampaignOptions {
  db: SpokeDbContext;
  campaignId: number;
  userId: number;
}

export const copyCampaign = async (options: CopyCampaignOptions) => {
  const { db, campaignId, userId } = options;

  const result = await db.primary.transaction(async (trx) => {
    // Copy campaign
    const {
      rows: [newCampaign]
    } = await trx.raw<QueryResult<CampaignRecord>>(
      `
        insert into campaign (
          organization_id,
          title,
          description,
          is_started,
          is_archived,
          due_by,
          logo_image_url,
          intro_html,
          primary_color,
          texting_hours_start,
          texting_hours_end,
          timezone,
          creator_id,
          is_autoassign_enabled,
          limit_assignment_to_teams,
          replies_stale_after_minutes,
          external_system_id
        )
        select
          organization_id,
          'COPY - ' || title,
          description,
          false as is_started,
          false as is_archived,
          due_by,
          logo_image_url,
          intro_html,
          primary_color,
          texting_hours_start,
          texting_hours_end,
          timezone,
          ? as creator_id,
          false as is_autoassign_enabled,
          limit_assignment_to_teams,
          replies_stale_after_minutes,
          external_system_id
        from campaign
        where id = ?
        returning *
      `,
      [userId, campaignId]
    );

    // Copy interactions
    const interactions = await trx<InteractionStepRecord>("interaction_step")
      .where({
        campaign_id: campaignId,
        is_deleted: false
      })
      .then((interactionSteps) =>
        interactionSteps.map<InteractionStepRecord | { id: string }>(
          (interactionStep) => ({
            id: `new${interactionStep.id}`,
            questionText: interactionStep.question,
            scriptOptions: interactionStep.script_options,
            answerOption: interactionStep.answer_option,
            answerActions: interactionStep.answer_actions,
            isDeleted: interactionStep.is_deleted,
            campaign_id: newCampaign.id,
            parentInteractionId: interactionStep.parent_interaction_id
              ? `new${interactionStep.parent_interaction_id}`
              : interactionStep.parent_interaction_id
          })
        )
      );

    await persistInteractionStepTree(
      newCampaign.id,
      makeTree(interactions, null /* id */),
      { is_started: false },
      trx
    );

    // Copy canned responses
    await trx.raw(
      `
        insert into canned_response (campaign_id, title, text)
        select
          ? as campaign_id,
          title,
          text
        from canned_response
        where campaign_id = ?
      `,
      [newCampaign.id, campaignId]
    );

    // Copy Teams
    await trx.raw(
      `
        insert into campaign_team (campaign_id, team_id)
        select
          ? as campaign_id,
          team_id
        from campaign_team
        where campaign_id = ?
      `,
      [newCampaign.id, campaignId]
    );

    // Copy Campaign Groups
    await trx.raw(
      `
        insert into campaign_group_campaign (campaign_id, campaign_group_id)
        select
          ? as campaign_id,
          campaign_group_id
        from campaign_group_campaign
        where campaign_id = ?
      `,
      [newCampaign.id, campaignId]
    );

    return newCampaign;
  });

  return result;
};
