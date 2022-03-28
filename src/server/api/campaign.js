import isNil from "lodash/isNil";

import { ExternalSyncReadinessState } from "../../api/campaign";
import { UserRoleType } from "../../api/organization-membership";
import { emptyRelayPage } from "../../api/pagination";
import { config } from "../../config";
import { parseIanaZone } from "../../lib/datetime";
import { cacheOpts, memoizer } from "../memoredis";
import { cacheableData, r } from "../models";
import { currentEditors } from "../models/cacheable_queries";
import { accessRequired } from "./errors";
import { getDeliverabilityStats } from "./lib/campaign";
import { symmetricEncrypt } from "./lib/crypto";
import { formatPage } from "./lib/pagination";
import { sqlResolvers } from "./lib/utils";
import { getOrgFeature } from "./organization-settings";
import { getUsers } from "./user";

export function addCampaignsFilterToQuery(queryParam, campaignsFilter) {
  let query = queryParam;

  if (campaignsFilter) {
    const resultSize = campaignsFilter.listSize ? campaignsFilter.listSize : 0;
    const pageSize = campaignsFilter.pageSize ? campaignsFilter.pageSize : 0;

    if ("isArchived" in campaignsFilter) {
      query = query.where("campaign.is_archived", campaignsFilter.isArchived);
    }

    if ("isStarted" in campaignsFilter) {
      query = query.where("campaign.is_started", campaignsFilter.isStarted);
    }

    if ("campaignId" in campaignsFilter) {
      query = query.where(
        "campaign.id",
        parseInt(campaignsFilter.campaignId, 10)
      );
    }
    if (resultSize && !pageSize) {
      query = query.limit(resultSize);
    }
    if (resultSize && pageSize) {
      query = query.limit(resultSize).offSet(pageSize);
    }
  }
  return query;
}

export function buildCampaignQuery(
  queryParam,
  organizationId,
  campaignsFilter,
  addFromClause = true
) {
  let query = queryParam;

  if (addFromClause) {
    query = query.from("campaign");
  }

  query = query.where("campaign.organization_id", organizationId);
  query = addCampaignsFilterToQuery(query, campaignsFilter);

  return query;
}

const doGetCampaigns = memoizer.memoize(
  async ({ organizationId, cursor, campaignsFilter }) => {
    let campaignsQuery = buildCampaignQuery(
      r.reader.select("*"),
      organizationId,
      campaignsFilter
    );
    campaignsQuery = campaignsQuery.orderBy("id", "asc");

    if (cursor) {
      // A limit of 0 means a page size of 'All'
      if (cursor.limit !== 0) {
        campaignsQuery = campaignsQuery
          .limit(cursor.limit)
          .offset(cursor.offset);
      }
      const campaigns = await campaignsQuery;

      const campaignsCountQuery = buildCampaignQuery(
        r.knex.count("*"),
        organizationId,
        campaignsFilter
      );

      const campaignsCount = await r.parseCount(campaignsCountQuery);

      const pageInfo = {
        limit: cursor.limit,
        offset: cursor.offset,
        total: campaignsCount
      };
      return {
        campaigns,
        pageInfo
      };
    }
    return campaignsQuery;
  },
  cacheOpts.CampaignsList
);

export async function getCampaigns(organizationId, cursor, campaignsFilter) {
  return doGetCampaigns({ organizationId, cursor, campaignsFilter });
}

const getCampaignOrganization = memoizer.memoize(async ({ campaignId }) => {
  const campaign = await r
    .reader("campaign")
    .where({ id: campaignId })
    .first("organization_id");
  return campaign.organization_id;
}, cacheOpts.CampaignOrganizationId);

export const resolvers = {
  JobRequest: {
    ...sqlResolvers([
      "id",
      "assigned",
      "status",
      "jobType",
      "resultMessage",
      "createdAt",
      "updatedAt"
    ])
  },
  CampaignStats: {
    sentMessagesCount: async (campaign) => {
      const getSentMessagesCount = memoizer.memoize(async ({ campaignId }) => {
        return r.parseCount(
          r
            .reader("campaign_contact")
            .join(
              "message",
              "message.campaign_contact_id",
              "campaign_contact.id"
            )
            .where({
              "campaign_contact.campaign_id": campaignId,
              "message.is_from_contact": false
            })
            .count()
        );
      }, cacheOpts.CampaignSentMessagesCount);

      return getSentMessagesCount({ campaignId: campaign.id });
    },
    receivedMessagesCount: async (campaign) => {
      const getReceivedMessagesCount = memoizer.memoize(
        async ({ campaignId }) => {
          return r.parseCount(
            r
              .reader("campaign_contact")
              .join(
                "message",
                "message.campaign_contact_id",
                "campaign_contact.id"
              )
              .where({
                "campaign_contact.campaign_id": campaignId,
                "message.is_from_contact": true
              })
              .count()
          );
        },
        cacheOpts.CampaignReceivedMessagesCount
      );

      return getReceivedMessagesCount({ campaignId: campaign.id });
    },
    optOutsCount: async (campaign) => {
      const getOptOutsCount = memoizer.memoize(
        async ({ campaignId, archived }) => {
          return r.getCount(
            r
              .reader("campaign_contact")
              .where({
                is_opted_out: true,
                campaign_id: campaignId
              })
              .whereRaw(`archived = ${archived}`) // partial index friendly
          );
        },
        cacheOpts.CampaignOptOutsCount
      );

      return getOptOutsCount({
        campaignId: campaign.id,
        archived: campaign.is_archived
      });
    },

    countMessagedContacts: async (campaign) => {
      const getCountMessagedContacts = memoizer.memoize(
        async ({ campaignId, archived }) => {
          const { rows } = await r.reader.raw(
            `
              select count(*) as count_messaged_contacts
              from campaign_contact
              where message_status <> 'needsMessage'
                and archived = ${archived}
                and campaign_id = ?
            `,
            [campaignId]
          );

          const [{ count_messaged_contacts: result }] = rows;
          return result;
        },
        cacheOpts.PercentUnhandledReplies
      );

      return getCountMessagedContacts({
        campaignId: campaign.id,
        archived: campaign.is_archived
      });
    },

    percentUnhandledReplies: async (campaign) => {
      const getPercentUnhandledReplies = memoizer.memoize(
        async ({ campaignId, archived }) => {
          const {
            rows: [{ percent_unhandled_replies: result }]
          } = await r.reader.raw(
            `
              with contact_counts as (
                select
                  count(*) filter (where message_status not in ('needsMessage', 'messaged', 'needsResponse')) as convo_or_closed_count,
                  count(*) filter (where message_status not in ('needsMessage', 'messaged'))::float as engaged_count
                from campaign_contact cc
                where cc.archived = ${archived}
                  and cc.campaign_id = ?
              )
              select
                coalesce(
                  ( convo_or_closed_count /  nullif(engaged_count, 0) ) * 100,
                  0
                ) as percent_unhandled_replies
              from contact_counts
            `,
            [campaignId]
          );

          return result;
        },
        cacheOpts.PercentUnhandledReplies
      );

      return getPercentUnhandledReplies({
        campaignId: campaign.id,
        archived: campaign.is_archived
      });
    }
  },
  CampaignReadiness: {
    id: ({ id }) => id,
    basics: (campaign) => campaign.title !== "" && campaign.description !== "",
    textingHours: (campaign) =>
      campaign.textingHoursStart !== null &&
      campaign.textingHoursEnd !== null &&
      campaign.timezone !== null,
    integration: () => true,
    contacts: (campaign) =>
      r
        .reader("campaign_contact")
        .select("campaign_contact.id")
        .where({ campaign_id: campaign.id })
        .limit(1)
        .then((records) => records.length > 0),
    autoassign: () => true,
    cannedResponses: () => true,
    texters: async (campaign) => {
      const { id, use_dynamic_assignment } = campaign;
      const {
        rows: [{ is_fully_assigned }]
      } = await r.knex.raw(
        `
          select not exists (
            select 1
            from campaign_contact
            where campaign_id = ? and assignment_id is null
          ) as is_fully_assigned
        `,
        [id]
      );
      return use_dynamic_assignment || is_fully_assigned;
    },
    interactions: (campaign) =>
      r
        .reader("interaction_step")
        .where({ campaign_id: campaign.id })
        .count()
        .then(([{ count }]) => count > 0),
    campaignGroups: () => true
  },
  CampaignsReturn: {
    __resolveType(obj, _context, _) {
      if (Array.isArray(obj)) {
        return "CampaignsList";
      }
      if ("campaigns" in obj && "pageInfo" in obj) {
        return "PaginatedCampaigns";
      }
      return null;
    }
  },
  CampaignsList: {
    campaigns: (campaigns) => {
      return campaigns;
    }
  },
  PaginatedCampaigns: {
    campaigns: (queryResult) => {
      return queryResult.campaigns;
    },
    pageInfo: (queryResult) => {
      if ("pageInfo" in queryResult) {
        return queryResult.pageInfo;
      }
      return null;
    }
  },
  Campaign: {
    ...sqlResolvers([
      "id",
      "title",
      "description",
      "isStarted",
      "isArchived",
      // TODO: re-enable once dynamic assignment is fixed (#548)
      // "useDynamicAssignment",
      "introHtml",
      "primaryColor",
      "logoImageUrl",
      "textingHoursStart",
      "textingHoursEnd",
      "isAutoassignEnabled",
      "createdAt",
      "landlinesFiltered",
      "autosendStatus"
    ]),
    isApproved: (campaign) =>
      isNil(campaign.is_approved) ? false : campaign.is_approved,
    timezone: (campaign) => parseIanaZone(campaign.timezone),
    readiness: (campaign) => campaign,
    repliesStaleAfter: (campaign) => campaign.replies_stale_after_minutes,
    useDynamicAssignment: (_) => false,
    isAssignmentLimitedToTeams: (campaign) =>
      campaign.limit_assignment_to_teams,
    dueBy: (campaign) =>
      campaign.due_by instanceof Date || !campaign.due_by
        ? campaign.due_by || null
        : new Date(campaign.due_by),
    organization: async (campaign, _, { loaders }) =>
      campaign.organization ||
      loaders.organization.load(campaign.organization_id),
    datawarehouseAvailable: (campaign, _, { user }) =>
      user.is_superadmin && config.WAREHOUSE_DB_TYPE !== undefined,
    pendingJobs: async (campaign, { jobTypes = [] }) => {
      const query = r
        .reader("job_request")
        .where({ campaign_id: campaign.id })
        .orderBy("updated_at", "desc");
      if (jobTypes.length > 0) {
        query.whereIn("job_type", jobTypes);
      }
      return query;
    },
    teams: async (campaign) => {
      const getCampaignTeams = memoizer.memoize(async ({ campaignId }) => {
        return r
          .reader("team")
          .select("team.*")
          .join("campaign_team", "campaign_team.team_id", "=", "team.id")
          .where({
            "campaign_team.campaign_id": campaignId
          });
      }, cacheOpts.CampaignTeams);

      return getCampaignTeams({ campaignId: campaign.id });
    },
    texters: async (campaign) =>
      getUsers(campaign.organization_id, null, { campaignId: campaign.id }),
    assignments: async (campaign, { assignmentsFilter = {} }) => {
      // TODO: permissions check needed
      let query = r.reader("assignment").where({ campaign_id: campaign.id });

      if (assignmentsFilter.texterId) {
        query = query.where({ user_id: assignmentsFilter.texterId });
      }

      return query;
    },
    interactionSteps: async (campaign) => {
      if (campaign.interactionSteps) {
        return campaign.interactionSteps;
      }

      const getInteractionSteps = memoizer.memoize(async ({ campaignId }) => {
        const interactionSteps = await cacheableData.campaign.dbInteractionSteps(
          campaignId
        );
        return interactionSteps;
      }, cacheOpts.CampaignInteractionSteps);

      return getInteractionSteps({ campaignId: campaign.id });
    },
    cannedResponses: async (campaign, { userId: userIdArg }) => {
      const getCannedResponses = memoizer.memoize(
        ({ campaignId, userId }) =>
          cacheableData.cannedResponse.query({ campaignId, userId }),
        cacheOpts.CampaignCannedResponses
      );

      return getCannedResponses({ campaignId: campaign.id, userId: userIdArg });
    },
    contacts: async (campaign) =>
      r
        .reader("campaign_contact")
        .where({ campaign_id: campaign.id })
        .whereRaw(`archived = ${campaign.is_archived}`), // partial index friendly
    contactsCount: async (campaign) =>
      r.getCount(
        r
          .reader("campaign_contact")
          .where({ campaign_id: campaign.id })
          .whereRaw(`archived = ${campaign.is_archived}`) // partial index friendly
      ),
    hasUnassignedContacts: async (campaign) => {
      if (config.BAD_BENS_DISABLE_HAS_UNASSIGNED_CONTACTS) {
        return false;
      }

      if (
        config.HIDE_CAMPAIGN_STATE_VARS_ON_ARCHIVED_CAMPAIGNS &&
        campaign.is_archived
      ) {
        return false;
      }

      const getHasUnassignedContacts = memoizer.memoize(
        async ({ campaignId, archived }) => {
          // SQL injection for archived = to enable use of partial index
          const { rows } = await r.reader.raw(
            `
            select exists (
              select 1
              from campaign_contact
              where
                campaign_id = ?
                and assignment_id is null
                and archived = ${archived}
                and not exists (
                  select 1
                  from campaign_contact_tag
                  join tag on campaign_contact_tag.tag_id = tag.id
                  where tag.is_assignable = false
                    and campaign_contact_tag.campaign_contact_id = campaign_contact.id
                )
                and is_opted_out = false
            ) as contact_exists
          `,
            [campaignId]
          );

          return rows[0] && rows[0].contact_exists;
        },
        cacheOpts.CampaignHasUnassignedContacts
      );

      return getHasUnassignedContacts({
        campaignId: campaign.id,
        archived: campaign.is_archived
      });
    },
    hasUnsentInitialMessages: async (campaign) => {
      if (
        config.HIDE_CAMPAIGN_STATE_VARS_ON_ARCHIVED_CAMPAIGNS &&
        campaign.is_archived
      ) {
        return false;
      }

      const getHasUnsentInitialMessages = memoizer.memoize(
        async ({ campaignId, archived }) => {
          const contacts = await r
            .reader("campaign_contact")
            .select("id")
            .where({
              campaign_id: campaignId,
              message_status: "needsMessage",
              is_opted_out: false
            })
            .whereRaw(`archived = ${archived}`) // partial index friendly
            .limit(1);
          return contacts.length > 0;
        },
        cacheOpts.CampaignHasUnsentInitialMessages
      );

      return getHasUnsentInitialMessages({
        campaignId: campaign.id,
        archived: campaign.is_archived
      });
    },
    hasUnhandledMessages: async (campaign) => {
      if (
        config.HIDE_CAMPAIGN_STATE_VARS_ON_ARCHIVED_CAMPAIGNS &&
        campaign.is_archived
      ) {
        return false;
      }

      const getHasUnhandledMessages = memoizer.memoize(
        async ({ campaignId, archived, organizationId }) => {
          let contactsQuery = r
            .reader("campaign_contact")
            .pluck("campaign_contact.id")
            .where({
              "campaign_contact.campaign_id": campaignId,
              message_status: "needsResponse",
              is_opted_out: false
            })
            .whereRaw(`archived = ${archived}`) // partial index friendly
            .limit(1);

          const notAssignableTagSubQuery = r.reader
            .select("campaign_contact_tag.campaign_contact_id")
            .from("campaign_contact_tag")
            .join("tag", "tag.id", "=", "campaign_contact_tag.tag_id")
            .where({
              "tag.organization_id": organizationId
            })
            .whereRaw("lower(tag.title) = 'escalated'")
            .whereRaw(
              "campaign_contact_tag.campaign_contact_id = campaign_contact.id"
            );

          contactsQuery = contactsQuery.whereNotExists(
            notAssignableTagSubQuery
          );

          const contacts = await contactsQuery;
          return contacts.length > 0;
        },
        cacheOpts.CampaignHasUnhandledMessages
      );

      return getHasUnhandledMessages({
        campaignId: campaign.id,
        archived: campaign.is_archived,
        organizationId: campaign.organization_id
      });
    },
    customFields: async (campaign) =>
      campaign.customFields ||
      cacheableData.campaign.dbCustomFields(campaign.id),
    stats: async (campaign) => campaign,
    editors: async (campaign, _, { user }) => {
      if (r.redis) {
        return currentEditors(r.redis, campaign, user);
      }
      return "";
    },
    creator: async (campaign, _, { loaders }) =>
      campaign.creator_id ? loaders.user.load(campaign.creator_id) : null,
    previewUrl: async (campaign, _, { user, loaders }) => {
      const campaignId = campaign.id;
      const organizationId = await getCampaignOrganization({ campaignId });
      const { features } = await loaders.organization.load(organizationId);
      const supervolAccess = getOrgFeature(
        "scriptPreviewForSupervolunteers",
        features
      );
      const requiredRole = supervolAccess
        ? UserRoleType.SUPERVOLUNTEER
        : UserRoleType.ADMIN;
      try {
        await accessRequired(user, organizationId, requiredRole);
      } catch {
        // Return null because Message Review uses loadData() HOC which does not tolerate errors
        return null;
      }
      const token = symmetricEncrypt(`${campaign.id}`);
      return token;
    },
    externalSystem: async (campaign) =>
      campaign.external_system_id
        ? r
            .reader("external_system")
            .where({ id: campaign.external_system_id })
            .first()
        : null,
    syncReadiness: async (campaign) => {
      if (!campaign.external_system_id)
        return ExternalSyncReadinessState.MISSING_SYSTEM;

      const {
        rows: [{ missing_and_required, includes_not_active }]
      } = await r.reader.raw(
        `
          select
            count(*) filter (where is_missing and is_required) as missing_and_required,
            count(*) filter (where includes_not_active) as includes_not_active
          from public.external_sync_question_response_configuration
          where
            campaign_id = ?
            and system_id = ?
        `,
        [campaign.id, campaign.external_system_id]
      );

      return missing_and_required > 0
        ? ExternalSyncReadinessState.MISSING_REQUIRED_MAPPING
        : includes_not_active > 0
        ? ExternalSyncReadinessState.INCLUDES_NOT_ACTIVE_TARGETS
        : ExternalSyncReadinessState.READY;
    },
    externalSyncConfigurations: async (campaign, { after, first }) => {
      if (!campaign.external_system_id) return emptyRelayPage();

      const query = r
        .reader("external_sync_question_response_configuration")
        .where({
          campaign_id: campaign.id,
          system_id: campaign.external_system_id
        });
      return formatPage(query, { after, first, primaryColumn: "compound_id" });
    },
    deliverabilityStats: async (campaign) => {
      const stats = await getDeliverabilityStats(parseInt(campaign.id, 10));
      return stats;
    },
    campaignGroups: async (campaign, { after, first }, { user }) => {
      const organizationId = parseInt(campaign.organization_id, 10);
      await accessRequired(user, organizationId, "ADMIN");

      const query = r
        .reader("campaign_group")
        .select("campaign_group.*")
        .join(
          "campaign_group_campaign",
          "campaign_group_campaign.campaign_group_id",
          "campaign_group.id"
        )
        .where({ campaign_id: campaign.id });
      const result = await formatPage(query, { after, first });
      return result;
    }
  }
};
