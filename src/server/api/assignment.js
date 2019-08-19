import logger from "../../logger";
import { config } from "../../config";
import { mapFieldsToModel } from "./lib/utils";
import { Assignment, r, cacheableData } from "../models";
import { getOffsets, defaultTimezoneIsBetweenTextingHours } from "../../lib";
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

  const [validOffsets, invalidOffsets] = getOffsets(config);
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
        if (defaultTimezoneIsBetweenTextingHours(config)) {
          // missing timezone ok
          validOffsets.push("");
        }
        query = query.whereIn("timezone_offset", validOffsets);
      } else if (validTimezone === false) {
        if (!defaultTimezoneIsBetweenTextingHours(config)) {
          // missing timezones are not ok to text
          invalidOffsets.push("");
        }
        query = query.whereIn("timezone_offset", invalidOffsets);
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
  return features.textRequestType;
}

export async function allCurrentAssignmentTargets(organizationId) {
  const assignmentType = await getCurrentAssignmentType(organizationId);

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

  /**
   * The second part of the union needs to be in parenthesis
   * so that the limit applies only to it and not the whole
   * query
   */
  const { rows: teamToCampaigns } = await r.knex.raw(
    `
      select team.title as team_title, campaign.id, campaign.title, (
          select count(*)
          from ${contactsView}
          where campaign_id = campaign.id
        ) as count_left
      from team
      join campaign_team on campaign_team.team_id = team.id
      join campaign on campaign.id = (
          select id 
          from ${campaignView}
          where ${campaignView}.id = campaign_team.campaign_id
            and organization_id = ?
          order by id asc
          limit 1
        )
      union
      ( 
        select 'General' as team_title, ${campaignView}.id, ${campaignView}.title, (
            select count(*)
            from ${contactsView}
            where campaign_id = ${campaignView}.id
              and organization_id = ?
        ) as count_left
        from ${campaignView}
        where ${campaignView}.limit_assignment_to_teams = false
        order by id asc
        limit 1
      )
    `,
    [organizationId, organizationId]
  );

  const result = teamToCampaigns.map(ttc =>
    Object.assign(ttc, { type: assignmentType })
  );

  return result;
}

export async function myCurrentAssignmentTarget(
  userId,
  organizationId,
  trx = r.knex
) {
  const assignmentType = await getCurrentAssignmentType(organizationId);

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

  /**
   * This query works via a union – first, find the assignment for the highest
   * priority team I'm a party of, then find the one for everyone,
   * and then select the first of that
   */

  const { rows: teamToCampaigns } = await trx.raw(
    `
      (
        select team.assignment_priority as priority, team.title as team_title, campaign.id, campaign.title, (
            select count(*)
            from ${contactsView}
            where campaign_id = campaign.id
          ) as count_left
        from team
        join campaign_team on campaign_team.team_id = team.id
        join campaign on campaign.id = (
            select id 
            from ${campaignView}
            where organization_id = ?
              and ${campaignView}.id = campaign_team.campaign_id
            order by id asc
            limit 1
          )
        where exists (
          select 1 from user_team
          where user_id = ? and team_id = team.id
        )
      )
      union
      ( 
        select '+infinity'::float as priority, 'General' as team_title, ${campaignView}.id, ${campaignView}.title, (
            select count(*)
            from ${contactsView}
            where campaign_id = ${campaignView}.id
              and organization_id = ?
        ) as count_left
        from ${campaignView}
        where ${campaignView}.limit_assignment_to_teams = false
        order by id asc
        limit 1
      )
      order by priority asc
      limit 1
    `,
    [organizationId, userId, organizationId]
  );

  const result =
    teamToCampaigns.slice(0, 1).map(ttc =>
      Object.assign(ttc, {
        type: assignmentType,
        campaign: { id: ttc.id, title: ttc.title }
      })
    )[0] || null;

  return result;
}

// TODO – deprecate this resolver
export async function currentAssignmentTarget(organizationId, trx = r.knex) {
  const assignmentType = await getCurrentAssignmentType(organizationId);

  const campaignContactStatus = {
    UNREPLIED: "needsResponse",
    UNSENT: "needsMessage"
  }[assignmentType];

  if (!campaignContactStatus) {
    return null;
  }

  const { rows: assignableCampaigns } = await trx.raw(
    `
    select
      *
    from
      campaign
    where
      is_started = true
      and is_archived = false
      and is_autoassign_enabled = true
      and texting_hours_end > extract(hour from (CURRENT_TIMESTAMP at time zone campaign.timezone))
      and exists (
        select 1
        from campaign_contact
        where
          campaign_contact.campaign_id = campaign.id
          and assignment_id is null
          and message_status = ?
          and is_opted_out = false
          and not exists (
            select 1
            from campaign_contact_tag
            join tag on campaign_contact_tag.tag_id = tag.id
            where tag.is_assignable = false
              and campaign_contact_tag.campaign_contact_id = campaign_contact.id
          )
      )
      ${
        organizationId !== undefined
          ? `and campaign.organization_id = ${organizationId}`
          : ""
      }
    ;
  `,
    [campaignContactStatus]
  );

  const campaign = assignableCampaigns[0];

  if (!campaign) return null;

  return { type: assignmentType, campaign };
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
          status: "approved",
          updated_at: r.knex.fn.now()
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
          status: "rejected",
          updated_at: r.knex.fn.now()
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
        campaign_id: campaignIdToAssignTo,
        max_contacts: countToAssign
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
        assignment_id = ?,
        updated_at = now()
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

  const { rowCount: messageUpdateCount } = await trx.raw(
    `
      update
        message
      set
        assignment_id = ?
      from
        (
          select
            id
          from
            campaign_contact
          where
            assignment_id = ?
        ) matching_contact
      where
        message.campaign_contact_id = matching_contact.id
      ;
    `,
    [assignmentId, assignmentId]
  );

  logger.verbose(
    `Updated ${ccUpdateCount} campaign contacts and ${messageUpdateCount} messages.`
  );
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
