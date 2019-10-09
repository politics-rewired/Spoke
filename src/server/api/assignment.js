import logger from "../../logger";
import { config } from "../../config";
import { mapFieldsToModel } from "./lib/utils";
import { Assignment, r, cacheableData } from "../models";
import { defaultTimezoneIsBetweenTextingHours } from "../../lib";
import { Notifications, sendUserNotification } from "../notifications";
import _ from "lodash";
import request from "superagent";

export function addWhereClauseForContactsFilterMessageStatusIrrespectiveOfPastDue(
  queryParameter,
  messageStatusFilter
) {
  if (!messageStatusFilter) {
    return queryParameter;
  }

  let query = queryParameter;
  if (messageStatusFilter === "needsMessageOrResponse") {
    query.whereIn("message_status", ["needsResponse", "needsMessage"]);
  } else {
    query = query.whereIn("message_status", messageStatusFilter.split(","));
  }
  return query;
}

export function getContacts(
  assignment,
  contactsFilter,
  organization,
  campaign,
  forCount = false
) {
  // / returns list of contacts eligible for contacting _now_ by a particular user
  const textingHoursEnforced = organization.texting_hours_enforced;
  const textingHoursStart = organization.texting_hours_start;
  const textingHoursEnd = organization.texting_hours_end;

  // 24-hours past due - why is this 24 hours offset?
  const includePastDue = contactsFilter && contactsFilter.includePastDue;
  const pastDue =
    campaign.due_by &&
    Number(campaign.due_by) + 24 * 60 * 60 * 1000 < Number(new Date());
  const config = { textingHoursStart, textingHoursEnd, textingHoursEnforced };

  if (campaign.override_organization_texting_hours) {
    const textingHoursStart = campaign.texting_hours_start;
    const textingHoursEnd = campaign.texting_hours_end;
    const textingHoursEnforced = campaign.texting_hours_enforced;
    const timezone = campaign.timezone;

    config.campaignTextingHours = {
      textingHoursStart,
      textingHoursEnd,
      textingHoursEnforced,
      timezone
    };
  }

  if (
    !includePastDue &&
    pastDue &&
    contactsFilter &&
    contactsFilter.messageStatus === "needsMessage"
  ) {
    return [];
  }

  let query = r.knex("campaign_contact").where({
    assignment_id: assignment.id
  });

  if (contactsFilter) {
    const validTimezone = contactsFilter.validTimezone;
    if (validTimezone !== null) {
      if (validTimezone === true) {
        query = query.whereRaw("contact_is_textable_now(timezone, ?, ?, ?)", [
          config.campaignTextingHours.textingHoursStart,
          config.campaignTextingHours.textingHoursEnd,
          defaultTimezoneIsBetweenTextingHours(config)
        ]);
      } else if (validTimezone === false) {
        // validTimezone === false means we're looking for an invalid timezone,
        // which means the contact is NOT textable right now
        query = query.whereRaw(
          "contact_is_textable_now(timezone, ?, ?, ?) = false",
          [
            config.campaignTextingHours.textingHoursStart,
            config.campaignTextingHours.textingHoursEnd,
            !defaultTimezoneIsBetweenTextingHours(config)
          ]
        );
      }
    }

    query = addWhereClauseForContactsFilterMessageStatusIrrespectiveOfPastDue(
      query,
      (contactsFilter && contactsFilter.messageStatus) ||
        (pastDue
          ? // by default if asking for 'send later' contacts we include only those that need replies
            "needsResponse"
          : // we do not want to return closed/messaged
            "needsMessageOrResponse")
    );

    if (Object.prototype.hasOwnProperty.call(contactsFilter, "isOptedOut")) {
      query = query.where("is_opted_out", contactsFilter.isOptedOut);
    }
  }

  if (!forCount) {
    if (contactsFilter && contactsFilter.messageStatus === "convo") {
      query = query.orderByRaw("message_status DESC, updated_at DESC");
    } else {
      query = query.orderByRaw("message_status DESC, updated_at");
    }
  }

  return query;
}

// Returns either "replies", "initials", or null
export async function getCurrentAssignmentType(organizationId) {
  const organization = await r
    .knex("organization")
    .select("features")
    .where({ id: parseInt(organizationId) })
    .first();

  const features = {};
  try {
    const parsed = JSON.parse(organization.features);
    Object.assign(features, parsed);
  } catch (ex) {
    // do nothing
  }

  return {
    assignmentType: features.textRequestType,
    generalEnabled: features.textRequestFormEnabled || false,
    orgMaxRequestCount: features.textRequestMaxCount || 0
  };
}

export async function allCurrentAssignmentTargets(organizationId) {
  const { assignmentType, generalEnabled } = await getCurrentAssignmentType(
    organizationId
  );

  const campaignView = {
    UNREPLIED: "assignable_campaigns_with_needs_reply",
    UNSENT: "assignable_campaigns_with_needs_message"
  }[assignmentType];

  const contactsView = {
    UNREPLIED: "assignable_needs_reply",
    UNSENT: "assignable_needs_message"
  }[assignmentType];

  if (!campaignView || !contactsView) {
    return [];
  }

  const generalEnabledBit = generalEnabled ? 1 : 0;

  /**
   * The second part of the union needs to be in parenthesis
   * so that the limit applies only to it and not the whole
   * query
   */
  const { rows: teamToCampaigns } = await r.knex.raw(
    /**
     * What a query!
     *
     * General is set to priority 0 here so that it shows up at the top of the page display
     */
    `
    with team_assignment_options as (
      select *
      from team
      where organization_id = ?
    ),
    needs_message_teams as (
      select * from team_assignment_options
      where assignment_type = 'UNSENT'
    ),
    needs_reply_teams as (
      select * from team_assignment_options
      where assignment_type = 'UNREPLIED'
    ),
    needs_message_team_campaign_pairings as (
      select
          teams.assignment_priority as priority, teams.id as team_id, teams.title as team_title, teams.is_assignment_enabled as enabled, teams.assignment_type,
          campaign.id as id, campaign.title
      from needs_message_teams as teams
      join campaign_team on campaign_team.team_id = teams.id
      join campaign on campaign.id = (
        select id
        from assignable_campaigns_with_needs_message as campaigns
        where campaigns.id = campaign_team.campaign_id
        order by id asc
        limit 1
      )
    ),
    needs_reply_team_campaign_pairings as (
      select
          teams.assignment_priority as priority, teams.id as team_id, teams.title as team_title, teams.is_assignment_enabled as enabled, teams.assignment_type,
          campaign.id as id, campaign.title
      from needs_reply_teams as teams
      join campaign_team on campaign_team.team_id = teams.id
      join campaign on campaign.id = (
        select id
        from assignable_campaigns_with_needs_reply as campaigns
        where campaigns.id = campaign_team.campaign_id
        order by id asc
        limit 1
      )
    ),
    general_campaign_pairing as (
      select
        0 as priority, -1 as team_id, 'General' as team_title, ${generalEnabledBit}::boolean as enabled, '${assignmentType}' as assignment_type,
        campaigns.id, campaigns.title
      from ${campaignView} as campaigns
      where campaigns.limit_assignment_to_teams = false
          and organization_id = ?
      order by id asc
      limit 1
    )
    ( select * from needs_message_team_campaign_pairings )
    union
    ( select * from needs_reply_team_campaign_pairings )
    union
    ( select * from general_campaign_pairing )
    order by priority asc`,
    [organizationId, organizationId]
  );

  return teamToCampaigns.map(row => ({ ...row, count_left: 0 }));
}

export async function myCurrentAssignmentTargets(
  userId,
  organizationId,
  trx = r.knex
) {
  const {
    assignmentType,
    generalEnabled,
    orgMaxRequestCount
  } = await getCurrentAssignmentType(organizationId);

  const campaignView = {
    UNREPLIED: "assignable_campaigns_with_needs_reply",
    UNSENT: "assignable_campaigns_with_needs_message"
  }[assignmentType];

  const contactsView = {
    UNREPLIED: "assignable_needs_reply",
    UNSENT: "assignable_needs_message"
  }[assignmentType];

  if (!campaignView || !contactsView) {
    return null;
  }

  const generalEnabledBit = generalEnabled ? 1 : 0;

  const { rows: teamToCampaigns } = await trx.raw(
    /**
     * This query is the same as allCurrentAssignmentTargets, except
     *  - it restricts teams to those with is_assignment_enabled = true via the where clause in team_assignment_options
     *  - it adds all_possible_team_assignments to set up my_possible_team_assignments
     */
    `
      with team_assignment_options as (
        select *
        from team
        where organization_id = ?
          and is_assignment_enabled = true
      ),
      needs_message_teams as (
        select * from team_assignment_options
        where assignment_type = 'UNSENT'
      ),
      needs_reply_teams as (
        select * from team_assignment_options
        where assignment_type = 'UNREPLIED'
      ),
      needs_message_team_campaign_pairings as (
        select
            teams.assignment_priority as priority, teams.id as team_id, teams.title as team_title, teams.is_assignment_enabled as enabled, teams.assignment_type, teams.max_request_count,
            campaign.id as id, campaign.title
        from needs_message_teams as teams
        join campaign_team on campaign_team.team_id = teams.id
        join campaign on campaign.id = (
          select id
          from assignable_campaigns_with_needs_message as campaigns
          where campaigns.id = campaign_team.campaign_id
          order by id asc
          limit 1
        )
      ),
      needs_reply_team_campaign_pairings as (
        select
            teams.assignment_priority as priority, teams.id as team_id, teams.title as team_title, teams.is_assignment_enabled as enabled, teams.assignment_type, teams.max_request_count,
            campaign.id as id, campaign.title
        from needs_reply_teams as teams
        join campaign_team on campaign_team.team_id = teams.id
        join campaign on campaign.id = (
          select id
          from assignable_campaigns_with_needs_reply as campaigns
          where campaigns.id = campaign_team.campaign_id
          order by id asc
          limit 1
        )
      ),
      general_campaign_pairing as (
        select
          '+infinity'::float as priority, -1 as team_id, 'General' as team_title, ${generalEnabledBit}::boolean as enabled, '${assignmentType}' as assignment_type, ${orgMaxRequestCount} as max_request_count,
          campaigns.id, campaigns.title
        from ${campaignView} as campaigns
        where campaigns.limit_assignment_to_teams = false
            and organization_id = ?
        order by id asc
        limit 1
      ),
      all_possible_team_assignments as (
        ( select * from needs_message_team_campaign_pairings )
        union
        ( select * from needs_reply_team_campaign_pairings )
      ),
      my_possible_team_assignments as (
        (
          select * from all_possible_team_assignments
          where exists (
            select 1 from user_team
            where team_id = all_possible_team_assignments.team_id
              and user_id = ?
          )
        )
        union 
        ( select * from general_campaign_pairing )
      )
      select * from my_possible_team_assignments
      where enabled = true
      order by priority asc`,
    [organizationId, organizationId, userId]
  );

  const results = teamToCampaigns.slice(0, 1).map(ttc =>
    Object.assign(ttc, {
      type: ttc.assignment_type,
      campaign: { id: ttc.id, title: ttc.title }
    })
  );

  return results;
}

export async function myCurrentAssignmentTarget(
  userId,
  organizationId,
  trx = r.knex
) {
  const options = await myCurrentAssignmentTargets(userId, organizationId, trx);
  return options ? options[0] : null;
}

async function notifyIfAllAssigned(type, user, organizationId) {
  if (config.ASSIGNMENT_COMPLETE_NOTIFICATION_URL) {
    const assignmentTarget = await currentAssignmentTarget(organizationId);
    if (assignmentTarget == null) {
      await request
        .post(config.ASSIGNMENT_COMPLETE_NOTIFICATION_URL)
        .send({ type, user });
      logger.verbose(`Notified about out of ${type} to assign`);
    }
  } else {
    logger.verbose(
      "Not checking if assignments are available – ASSIGNMENT_COMPLETE_NOTIFICATION_URL is unset"
    );
  }
}

// TODO – deprecate this resolver
export async function countLeft(assignmentType, campaign) {
  const campaignContactStatus = {
    UNREPLIED: "needsResponse",
    UNSENT: "needsMessage"
  }[assignmentType];

  const result = await r.parseCount(
    r
      .knex("campaign_contact")
      .count()
      .where({
        assignment_id: null,
        message_status: campaignContactStatus,
        campaign_id: campaign
      })
  );
  return result;
}

export async function fulfillPendingRequestFor(auth0Id) {
  const user = await r
    .knex("user")
    .first("id")
    .where({ auth0_id: auth0Id });

  if (!user) {
    throw new Error(`No user found with id ${auth0Id}`);
  }

  // External assignment service may not be organization-aware so we default to the highest organization ID
  const pendingAssignmentRequest = await r
    .knex("assignment_request")
    .where({ status: "pending", user_id: user.id })
    .orderBy("organization_id", "desc")
    .first("*");

  if (!pendingAssignmentRequest) {
    throw new Error(`No pending request exists for ${auth0Id}`);
  }

  const numberAssigned = await r.knex.transaction(async trx => {
    try {
      const numberAssigned = await giveUserMoreTexts(
        auth0Id,
        pendingAssignmentRequest.amount,
        pendingAssignmentRequest.organization_id,
        trx
      );

      await trx("assignment_request")
        .update({
          status: "approved"
        })
        .where({ id: pendingAssignmentRequest.id });

      return numberAssigned;
    } catch (ex) {
      logger.info(
        `Failed to give user ${auth0Id} more texts. Marking their request as rejected.`,
        ex.message
      );

      // Mark as rejected outside the transaction so it is unaffected by the rollback
      await r
        .knex("assignment_request")
        .update({
          status: "rejected"
        })
        .where({ id: pendingAssignmentRequest.id });

      throw new Error(ex.message);
    }
  });

  return numberAssigned;
}

export async function giveUserMoreTexts(
  auth0Id,
  count,
  organizationId,
  parentTrx = r.knex
) {
  logger.verbose(`Starting to give ${auth0Id} ${count} texts`);

  const matchingUsers = await r.knex("user").where({ auth0_id: auth0Id });
  const user = matchingUsers[0];
  if (!user) {
    throw new Error(`No user found with id ${auth0Id}`);
  }

  const assignmentInfo = await myCurrentAssignmentTarget(
    user.id,
    organizationId
  );
  if (!assignmentInfo) {
    throw new Error("Could not find a suitable campaign to assign to.");
  }

  let countUpdated = 0;
  let countLeftToUpdate = count;

  const updated_result = await parentTrx.transaction(async trx => {
    while (countLeftToUpdate > 0) {
      const countUpdatedInLoop = await assignLoop(
        user,
        organizationId,
        countLeftToUpdate,
        trx
      );

      countLeftToUpdate = countLeftToUpdate - countUpdatedInLoop;
      countUpdated = countUpdated + countUpdatedInLoop;

      if (countUpdatedInLoop === 0) {
        if (countUpdated === 0) {
          throw new Error("Could not find a suitable campaign to assign to.");
        } else {
          return countUpdated;
        }
      }
    }

    return countUpdated;
  });

  // Async function, not awaiting because response to external assignment tool does not depend on it
  notifyIfAllAssigned(assignmentInfo.type, auth0Id, organizationId);

  return updated_result;
}

export async function assignLoop(user, organizationId, countLeft, trx) {
  const assignmentInfo = await myCurrentAssignmentTarget(
    user.id,
    organizationId,
    trx
  );
  if (!assignmentInfo) {
    return 0;
  }

  // Determine which campaign to assign to – optimize to pick winners
  let campaignIdToAssignTo = assignmentInfo.campaign.id;
  let countToAssign = countLeft;
  logger.info(
    `Assigning ${countToAssign} on campaign ${campaignIdToAssignTo} of type ${
      assignmentInfo.type
    }`
  );

  // Assign a max of `count` contacts in `campaignIdToAssignTo` to `user`
  let assignmentId;
  const existingAssignment = await trx("assignment")
    .where({
      user_id: user.id,
      campaign_id: campaignIdToAssignTo
    })
    .first();

  if (!existingAssignment) {
    const inserted = await trx("assignment")
      .insert({
        user_id: user.id,
        campaign_id: campaignIdToAssignTo
      })
      .returning("id");
    assignmentId = inserted[0];
  } else {
    assignmentId = existingAssignment.id;
  }

  logger.verbose(`Assigning to assignment id ${assignmentId}`);

  const campaignContactStatus = {
    UNREPLIED: "needsResponse",
    UNSENT: "needsMessage"
  }[assignmentInfo.type];

  const { rowCount: ccUpdateCount } = await trx.raw(
    `
      update
        campaign_contact as target_contact
      set
        assignment_id = ?
      from
        (
          select
            id
          from
            campaign_contact
          where
            assignment_id is null
            and campaign_id = ?
            and message_status = ?
            and is_opted_out = false
            and not exists (
              select 1
              from campaign_contact_tag
              join tag on campaign_contact_tag.tag_id = tag.id
              where tag.is_assignable = false
                and campaign_contact_tag.campaign_contact_id = campaign_contact.id
            )
          limit ?
          for update skip locked
        ) matching_contact
      where
        target_contact.id = matching_contact.id
      ;
    `,
    [assignmentId, campaignIdToAssignTo, campaignContactStatus, countToAssign]
  );

  logger.verbose(`Updated ${ccUpdateCount} campaign contacts`);
  return ccUpdateCount;
}

export const resolvers = {
  Assignment: {
    ...mapFieldsToModel(["id", "maxContacts"], Assignment),
    texter: async (assignment, _, { loaders }) =>
      assignment.texter
        ? assignment.texter
        : loaders.user.load(assignment.user_id),
    campaign: async (assignment, _, { loaders }) =>
      loaders.campaign.load(assignment.campaign_id),
    contactsCount: async (assignment, { contactsFilter }) => {
      const campaign = await r.table("campaign").get(assignment.campaign_id);

      const organization = await r
        .table("organization")
        .get(campaign.organization_id);

      return await r.getCount(
        getContacts(assignment, contactsFilter, organization, campaign, true)
      );
    },
    contacts: async (assignment, { contactsFilter }) => {
      const campaign = await r.table("campaign").get(assignment.campaign_id);

      const organization = await r
        .table("organization")
        .get(campaign.organization_id);
      return getContacts(assignment, contactsFilter, organization, campaign);
    },
    campaignCannedResponses: async assignment =>
      await cacheableData.cannedResponse.query({
        userId: "",
        campaignId: assignment.campaign_id
      }),
    userCannedResponses: async assignment =>
      await cacheableData.cannedResponse.query({
        userId: assignment.user_id,
        campaignId: assignment.campaign_id
      })
  }
};
