/* eslint-disable import/prefer-default-export */
import isEqual from "lodash/isEqual";
import isNil from "lodash/isNil";
import { QueryResult } from "pg";

import {
  Campaign,
  CampaignInput,
  CampaignsFilter
} from "../../../api/campaign";
import { RelayPaginatedResponse } from "../../../api/pagination";
import { config } from "../../../config";
import { gzip, makeTree } from "../../../lib";
import { parseIanaZone } from "../../../lib/datetime";
import {
  loadContactsFromDataWarehouse,
  uploadContacts
} from "../../../workers/jobs";
import type { SpokeDbContext } from "../../contexts/types";
import { cacheOpts, memoizer } from "../../memoredis";
import { cacheableData, datawarehouse, r } from "../../models";
import { addAssignTexters } from "../../tasks/assign-texters";
import { accessRequired } from "../errors";
import { CampaignRecord, InteractionStepRecord, UserRecord } from "../types";
import { processContactsFile } from "./edit-campaign";
import { persistInteractionStepTree } from "./interaction-steps";
import { formatPage } from "./pagination";

const { JOBS_SAME_PROCESS } = config;

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

interface DeliverabilityStatsFilter {
  initialMessagesOnly?: boolean;
}

export const getDeliverabilityStats = async (
  campaignId: number,
  filter: DeliverabilityStatsFilter = {}
) => {
  const { initialMessagesOnly = false } = filter;

  const selectClause = initialMessagesOnly
    ? "select distinct on (campaign_contact_id)"
    : "select";
  const orderClause = initialMessagesOnly
    ? "order by campaign_contact_id, message.id asc"
    : "";

  const rows = await r.reader
    .raw(
      `
        with messages_for_stats as (
          ${selectClause}
            send_status,
            coalesce(error_codes, '{}') as error_codes
          from message
          join campaign_contact on campaign_contact.id = message.campaign_contact_id
          where campaign_contact.campaign_id = ?
            and is_from_contact = false
          ${orderClause}
        )
        select count(*), send_status, error_codes
        from messages_for_stats
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
          is_approved,
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
          false as is_approved,
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

export const editCampaign = async (
  id: number,
  campaign: CampaignInput,
  loaders: any,
  user: UserRecord,
  origCampaignRecord: CampaignRecord,
  requiresApproval = false
) => {
  const unstartIfNecessary = async () => {
    if (!user.is_superadmin && requiresApproval) {
      await r
        .knex("campaign")
        .update({ is_started: false, is_approved: false })
        .where({ id });
    }
  };

  const {
    title,
    description,
    dueBy,
    useDynamicAssignment: _useDynamicAssignment,
    logoImageUrl,
    introHtml,
    primaryColor,
    textingHoursStart,
    textingHoursEnd,
    isAutoassignEnabled,
    repliesStaleAfter,
    timezone,
    externalSystemId
  } = campaign;

  const organizationId = origCampaignRecord.organization_id;
  const campaignUpdates: Partial<CampaignRecord> = {
    id,
    title: title ?? undefined,
    description: description ?? undefined,
    due_by: dueBy,
    organization_id: organizationId,
    // TODO: re-enable once dynamic assignment is fixed (#548)
    // use_dynamic_assignment: useDynamicAssignment,
    logo_image_url: logoImageUrl,
    primary_color: primaryColor,
    intro_html: introHtml,
    texting_hours_start: textingHoursStart ?? undefined,
    texting_hours_end: textingHoursEnd ?? undefined,
    is_autoassign_enabled: isAutoassignEnabled ?? undefined,
    replies_stale_after_minutes: repliesStaleAfter, // this is null to unset it - it must be null, not undefined
    timezone: timezone ? parseIanaZone(timezone) : undefined,
    external_system_id: externalSystemId
  };

  Object.keys(campaignUpdates).forEach((key) => {
    if (typeof campaignUpdates[key as keyof CampaignRecord] === "undefined") {
      delete campaignUpdates[key as keyof CampaignRecord];
    }
  });

  if (
    Object.prototype.hasOwnProperty.call(campaign, "externalListId") &&
    campaign.externalListId
  ) {
    await r.knex("campaign_contact").where({ campaign_id: id }).del();
    await r.knex.raw(
      `select * from public.queue_load_list_into_campaign(?, ?)`,
      [id, parseInt(campaign.externalListId, 10)]
    );
  }

  let validationStats = {};
  if (
    Object.prototype.hasOwnProperty.call(campaign, "contactsFile") &&
    campaign.contactsFile
  ) {
    const processedContacts = await processContactsFile(campaign.contactsFile);
    campaign.contacts = processedContacts.contacts;
    validationStats = processedContacts.validationStats;
  }

  if (
    Object.prototype.hasOwnProperty.call(campaign, "contacts") &&
    campaign.contacts
  ) {
    await accessRequired(user, organizationId, "ADMIN", /* superadmin */ true);

    // Uploading contacts from a CSV invalidates external system configuration
    await r
      .knex("campaign")
      .update({
        external_system_id: null
      })
      .where({ id });

    const contactsToSave = campaign.contacts.map((datum) => {
      const modelData = {
        campaign_id: id,
        first_name: datum.firstName,
        last_name: datum.lastName,
        cell: datum.cell,
        external_id: datum.external_id,
        custom_fields: datum.customFields,
        message_status: "needsMessage",
        is_opted_out: false,
        zip: datum.zip || ""
      };
      modelData.campaign_id = id;
      return modelData;
    });
    const jobPayload = {
      excludeCampaignIds: campaign.excludeCampaignIds || [],
      contacts: contactsToSave,
      filterOutLandlines: campaign.filterOutLandlines,
      validationStats
    };
    const compressedString = await gzip(JSON.stringify(jobPayload));
    const [job] = await r
      .knex("job_request")
      .insert({
        queue_name: `${id}:edit_campaign`,
        job_type: "upload_contacts",
        locks_queue: true,
        assigned: JOBS_SAME_PROCESS, // can get called immediately, below
        campaign_id: id,
        // NOTE: stringifying because compressedString is a binary buffer
        payload: compressedString.toString("base64")
      })
      .returning("*");
    if (JOBS_SAME_PROCESS) {
      uploadContacts(job);
    }
  }
  if (
    Object.prototype.hasOwnProperty.call(campaign, "contactSql") &&
    datawarehouse &&
    user.is_superadmin
  ) {
    await accessRequired(user, organizationId, "ADMIN", /* superadmin */ true);
    const [job] = await r
      .knex("job_request")
      .insert({
        queue_name: `${id}:edit_campaign`,
        job_type: "upload_contacts_sql",
        locks_queue: true,
        assigned: JOBS_SAME_PROCESS, // can get called immediately, below
        campaign_id: id,
        payload: campaign.contactSql
      })
      .returning("*");
    if (JOBS_SAME_PROCESS) {
      loadContactsFromDataWarehouse(job);
    }
  }
  if (
    Object.prototype.hasOwnProperty.call(campaign, "isAssignmentLimitedToTeams")
  ) {
    await r
      .knex("campaign")
      .update({
        limit_assignment_to_teams: campaign.isAssignmentLimitedToTeams
      })
      .where({ id });
  }
  if (Object.prototype.hasOwnProperty.call(campaign, "teamIds")) {
    await r.knex.transaction(async (trx) => {
      // Remove all existing team memberships and then add everything again
      await trx("campaign_team").where({ campaign_id: id }).del();
      await trx("campaign_team").insert(
        campaign.teamIds.map((team_id) => ({
          team_id,
          campaign_id: id
        }))
      );
    });
    memoizer.invalidate(cacheOpts.CampaignTeams.key, { campaignId: id });
  }
  if (Object.prototype.hasOwnProperty.call(campaign, "campaignGroupIds")) {
    const campaignGroupIds = campaign.campaignGroupIds ?? [];
    await r.knex.transaction(async (trx) => {
      // Remove all existing team memberships and then add everything again
      await trx.raw(
        `
          delete from campaign_group_campaign
          where
            campaign_id = ?
            and campaign_group_id in (
              select id
              from campaign_group
              where
                organization_id = ?
                and id != ALL(?)
            )
        `,
        [id, organizationId, campaignGroupIds]
      );

      if (campaignGroupIds.length < 1) return;
      const valuesStr = [...Array(campaignGroupIds.length)]
        .map(() => "(?, ?)")
        .join(", ");
      await trx.raw(
        `
          insert into campaign_group_campaign (campaign_group_id, campaign_id)
          values ${valuesStr}
          on conflict (campaign_group_id, campaign_id) do nothing
        `,
        campaignGroupIds.flatMap((groupId) => [groupId, id])
      );
    });
  }
  if (Object.prototype.hasOwnProperty.call(campaign, "texters")) {
    const { assignmentInputs, ignoreAfterDate } = campaign.texters;
    await addAssignTexters({
      campaignId: id,
      assignmentInputs,
      ignoreAfterDate
    });
  }

  if (Object.prototype.hasOwnProperty.call(campaign, "interactionSteps")) {
    await unstartIfNecessary();
    memoizer.invalidate(cacheOpts.CampaignInteractionSteps.key, {
      campaignId: id
    });
    // TODO: debug why { script: '' } is even being sent from the client in the first place
    if (!isEqual(campaign.interactionSteps, { scriptOptions: [""] })) {
      await accessRequired(
        user,
        organizationId,
        "SUPERVOLUNTEER",
        /* superadmin */ true
      );
      await persistInteractionStepTree(
        id,
        campaign.interactionSteps ?? [],
        origCampaignRecord
      );
    }
  }

  if (Object.prototype.hasOwnProperty.call(campaign, "cannedResponses")) {
    await unstartIfNecessary();
    memoizer.invalidate(cacheOpts.CampaignCannedResponses.key, {
      campaignId: id
    });

    // Ignore the mocked `id` automatically created on the input by GraphQL
    const convertedResponses = campaign.cannedResponses.map(
      ({ id: _cannedResponseId, ...response }: { id: number } | any) => ({
        ...response,
        campaign_id: id
      })
    );

    await r.knex.transaction(async (trx) => {
      await trx("canned_response")
        .where({ campaign_id: id })
        .whereNull("user_id")
        .del();
      await trx("canned_response").insert(convertedResponses);
    });

    await cacheableData.cannedResponse.clearQuery({
      userId: "",
      campaignId: id
    });
  }

  const [newCampaign] = await r
    .knex("campaign")
    .update(campaignUpdates)
    .where({ id })
    .returning("*");
  cacheableData.campaign.reload(id);
  return newCampaign || loaders.campaign.load(id);
};
