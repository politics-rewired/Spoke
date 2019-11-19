import { config } from "../../config";
import { mapFieldsToModel } from "./lib/utils";
import { Campaign, JobRequest, r, cacheableData } from "../models";
import { currentEditors } from "../models/cacheable_queries";
import { getUsers } from "./user";

export function addCampaignsFilterToQuery(queryParam, campaignsFilter) {
  let query = queryParam;

  if (campaignsFilter) {
    const resultSize = campaignsFilter.listSize ? campaignsFilter.listSize : 0;
    const pageSize = campaignsFilter.pageSize ? campaignsFilter.pageSize : 0;

    if ("isArchived" in campaignsFilter) {
      query = query.where("campaign.is_archived", campaignsFilter.isArchived);
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

export async function getCampaigns(organizationId, cursor, campaignsFilter) {
  let campaignsQuery = buildCampaignQuery(
    r.reader.select("*"),
    organizationId,
    campaignsFilter
  );
  campaignsQuery = campaignsQuery.orderBy("due_by", "desc").orderBy("id");

  if (cursor) {
    // A limit of 0 means a page size of 'All'
    if (cursor.limit !== 0) {
      campaignsQuery = campaignsQuery.limit(cursor.limit).offset(cursor.offset);
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
  } else {
    return campaignsQuery;
  }
}

export const resolvers = {
  JobRequest: {
    ...mapFieldsToModel(
      ["id", "assigned", "status", "jobType", "resultMessage"],
      JobRequest
    )
  },
  CampaignStats: {
    sentMessagesCount: async campaign =>
      r.parseCount(
        r
          .reader("campaign_contact")
          .join("message", "message.campaign_contact_id", "campaign_contact.id")
          .where({
            "campaign_contact.campaign_id": campaign.id,
            "message.is_from_contact": false
          })
          .count()
      ),
    receivedMessagesCount: async campaign =>
      r.parseCount(
        r
          .reader("campaign_contact")
          .join("message", "message.campaign_contact_id", "campaign_contact.id")
          .where({
            "campaign_contact.campaign_id": campaign.id,
            "message.is_from_contact": true
          })
          .count()
      ),
    optOutsCount: async campaign =>
      await r.getCount(
        r.reader("campaign_contact").where({
          is_opted_out: true,
          campaign_id: campaign.id,
          archived: campaign.is_archived
        })
      )
  },
  CampaignsReturn: {
    __resolveType(obj, context, _) {
      if (Array.isArray(obj)) {
        return "CampaignsList";
      } else if ("campaigns" in obj && "pageInfo" in obj) {
        return "PaginatedCampaigns";
      }
      return null;
    }
  },
  CampaignsList: {
    campaigns: campaigns => {
      return campaigns;
    }
  },
  PaginatedCampaigns: {
    campaigns: queryResult => {
      return queryResult.campaigns;
    },
    pageInfo: queryResult => {
      if ("pageInfo" in queryResult) {
        return queryResult.pageInfo;
      }
      return null;
    }
  },
  Campaign: {
    ...mapFieldsToModel(
      [
        "id",
        "title",
        "description",
        "isStarted",
        "isArchived",
        "useDynamicAssignment",
        "introHtml",
        "primaryColor",
        "logoImageUrl",
        "textingHoursStart",
        "textingHoursEnd",
        "isAutoassignEnabled",
        "timezone",
        "createdAt"
      ],
      Campaign
    ),
    isAssignmentLimitedToTeams: campaign => campaign.limit_assignment_to_teams,
    dueBy: campaign =>
      campaign.due_by instanceof Date || !campaign.due_by
        ? campaign.due_by || null
        : new Date(campaign.due_by),
    organization: async (campaign, _, { loaders }) =>
      campaign.organization ||
      loaders.organization.load(campaign.organization_id),
    datawarehouseAvailable: (campaign, _, { user }) =>
      user.is_superadmin && !!config.WAREHOUSE_DB_HOST,
    pendingJobs: async campaign =>
      r
        .reader("job_request")
        .where({ campaign_id: campaign.id })
        .orderBy("updated_at", "desc"),
    teams: async campaign =>
      r
        .reader("team")
        .select("team.*")
        .join("campaign_team", "campaign_team.team_id", "=", "team.id")
        .where({
          "campaign_team.campaign_id": campaign.id
        }),
    texters: async campaign =>
      getUsers(campaign.organization_id, null, { campaignId: campaign.id }),
    assignments: async (campaign, { assignmentsFilter = {} }) => {
      // TODO: permissions check needed
      let query = r.reader("assignment").where({ campaign_id: campaign.id });

      if (assignmentsFilter.texterId) {
        query = query.where({ user_id: assignmentsFilter.texterId });
      }

      return query;
    },
    interactionSteps: async campaign =>
      campaign.interactionSteps ||
      cacheableData.campaign.dbInteractionSteps(campaign.id),
    cannedResponses: async (campaign, { userId }) =>
      await cacheableData.cannedResponse.query({
        userId: userId || "",
        campaignId: campaign.id
      }),
    contacts: async campaign =>
      r
        .reader("campaign_contact")
        .where({ campaign_id: campaign.id, archived: campaign.is_archived }),
    contactsCount: async campaign =>
      await r.getCount(
        r
          .reader("campaign_contact")
          .where({ campaign_id: campaign.id, archived: campaign.is_archived })
      ),
    hasUnassignedContacts: async campaign => {
      if (config.BAD_BENS_DISABLE_HAS_UNASSIGNED_CONTACTS) {
        return false;
      }

      const { rows } = await r.reader.raw(
        `
        select exists (
          select 1
          from campaign_contact
          where
            campaign_id = ?
            and assignment_id is null
            and archived = ?
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
        [campaign.id, campaign.is_archived]
      );

      return rows[0] && rows[0].contact_exists;
    },
    hasUnsentInitialMessages: async campaign => {
      const contacts = await r
        .reader("campaign_contact")
        .select("id")
        .where({
          campaign_id: campaign.id,
          message_status: "needsMessage",
          archived: campaign.is_archived,
          is_opted_out: false
        })
        .limit(1);
      return contacts.length > 0;
    },
    hasUnhandledMessages: async campaign => {
      // TODO: restrict to sufficiently old values for updated_at

      let contactsQuery = r
        .reader("campaign_contact")
        .pluck("campaign_contact.id")
        .where({
          "campaign_contact.campaign_id": campaign.id,
          archived: campaign.is_archived,
          message_status: "needsResponse",
          is_opted_out: false
        })
        .limit(1);

      const notAssignableTagSubQuery = r.reader
        .select("campaign_contact_tag.campaign_contact_id")
        .from("campaign_contact_tag")
        .join("tag", "tag.id", "=", "campaign_contact_tag.tag_id")
        .where({
          "tag.organization_id": campaign.organization_id
        })
        .whereRaw("lower(tag.title) = 'escalated'")
        .whereRaw(
          "campaign_contact_tag.campaign_contact_id = campaign_contact.id"
        );

      contactsQuery = contactsQuery.whereNotExists(notAssignableTagSubQuery);

      const contacts = await contactsQuery;
      return contacts.length > 0;
    },
    customFields: async campaign =>
      campaign.customFields ||
      cacheableData.campaign.dbCustomFields(campaign.id),
    stats: async campaign => campaign,
    editors: async (campaign, _, { user }) => {
      if (r.redis) {
        return currentEditors(r.redis, campaign, user);
      }
      return "";
    },
    creator: async (campaign, _, { loaders }) =>
      campaign.creator_id ? loaders.user.load(campaign.creator_id) : null
  }
};
