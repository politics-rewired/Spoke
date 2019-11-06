import moment from "moment-timezone";

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

/**
 * Returns true if it is currently between the start and end hours in the specified timezone.
 *
 * @param {string} timezone The timezone in which to evaluate
 * @param {number} starthour Interval starting hour in 24-hour format
 * @param {number} endHour Interval ending hour in 24-hour format
 */
const isNowBetween = (timezone, starthour, endHour) => {
  const campaignTime = moment()
    .tz(timezone)
    .startOf("day");

  const startTime = campaignTime.clone().hour(starthour);
  const endTime = campaignTime.clone().hour(endHour);
  return moment().isBetween(startTime, endTime);
};

/**
 * Given query parameters, an assignment record, and its associated records, build a Knex query
 * to fetch matching contacts.
 * @param {object} assignment The assignment record to fetch contacts for
 * @param {object} contactsFilter A filter object
 * @param {object} organization The record of the organization of the assignment's campaign
 * @param {object} campaign The record of the campaign the assignment is part of
 * @param {boolean} forCount When `true`, return a count(*) query
 * @returns {Knex} The Knex query
 */
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

  let query = r.reader("campaign_contact").where({
    assignment_id: assignment.id
  });

  if (contactsFilter) {
    const validTimezone = contactsFilter.validTimezone;
    if (validTimezone !== null) {
      const {
        timezone: campaignTimezone,
        textingHoursStart,
        textingHoursEnd
      } = config.campaignTextingHours;

      const isCampaignTimezoneValid = isNowBetween(
        campaignTimezone,
        textingHoursStart,
        textingHoursEnd
      );

      if (validTimezone === true) {
        query = query.whereRaw(
          "contact_is_textable_now(timezone, ?, ?, ?) = true",
          [textingHoursStart, textingHoursEnd, isCampaignTimezoneValid]
        );
      } else if (validTimezone === false) {
        // validTimezone === false means we're looking for an invalid timezone,
        // which means the contact is NOT textable right now
        query = query.whereRaw(
          "contact_is_textable_now(timezone, ?, ?, ?) is distinct from true",
          [textingHoursStart, textingHoursEnd, isCampaignTimezoneValid]
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

  // Don't bother ordering the results if we only want the count
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
    .reader("organization")
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

  const generalAssignmentType = generalEnabled ? assignmentType : "NOTHING";
  const generalAssignmentBit = generalEnabled ? 1 : 0;

  const { rows: teamToCampaigns } = await r.reader.raw(
    /**
     * What a query!
     *
     * General is set to priority 0 here so that it shows up at the top of the page display
     */
    `
    select teams.title as team_title, teams.assignment_priority, teams.assignment_type, teams.is_assignment_enabled as enabled, campaign.id, campaign.title, 
      (
        select count(*)
        from campaign_contact
        where campaign_id = campaign.id
          and message_status = (
            case
              when teams.assignment_type = 'UNSENT' then
                'needsMessage'
              when teams.assignment_type = 'UNREPLIED' then
                'needsResponse'
            end
          ) 
          and extract('hour' from current_timestamp at time zone coalesce(campaign_contact.timezone, campaign.timezone)) >= campaign.texting_hours_start
          and extract('hour' from (current_timestamp + interval '5 minutes') at time zone coalesce(campaign_contact.timezone, campaign.timezone)) < campaign.texting_hours_end
          and not exists (
            select 1
            from campaign_contact_tag
            join tag
              on tag.id = campaign_contact_tag.tag_id
              and campaign_contact_tag.campaign_contact_id = campaign_contact.id
            where tag.is_assignable = false
              and not exists (
                select 1
                from team_escalation_tags
                where team_escalation_tags.tag_id = tag.id
                  and team_escalation_tags.team_id = teams.id
              )
          )
      ) as count_left
    from (
      select id, title, assignment_priority, assignment_type, organization_id, is_assignment_enabled from team
      union
      select 0, 'General', 'infinity'::float, '${generalAssignmentType}', ${organizationId}, '${generalAssignmentBit}'::boolean
    ) as teams
    join campaign on campaign.id = (
      select id
      from campaign
      where organization_id = teams.organization_id
        and is_started = true
        and is_archived = false
        and is_autoassign_enabled = true 
        and (
          limit_assignment_to_teams = false
          or exists (
            select 1
            from campaign_team
            where campaign_team.campaign_id = campaign.id
              and campaign_team.team_id = teams.id
          )
        )
        and exists (
          select 1
          from campaign_contact
          where campaign_id = campaign.id
            and assignment_id is null
            and message_status = (
              case
                when teams.assignment_type = 'UNSENT' then
                  'needsMessage'
                when teams.assignment_type = 'UNREPLIED' then
                  'needsResponse'
              end
            )
            and extract('hour' from current_timestamp at time zone coalesce(campaign_contact.timezone, campaign.timezone)) >= campaign.texting_hours_start
            and extract('hour' from (current_timestamp + interval '5 minutes') at time zone coalesce(campaign_contact.timezone, campaign.timezone)) < campaign.texting_hours_end
            and not exists (
              select 1
              from campaign_contact_tag
              join tag
                on tag.id = campaign_contact_tag.tag_id
                and campaign_contact_tag.campaign_contact_id = campaign_contact.id
              where tag.is_assignable = false
                and not exists (
                  select 1
                  from team_escalation_tags
                  where team_escalation_tags.tag_id = tag.id
                    and team_escalation_tags.team_id = teams.id
                )
            )
        )
      order by id asc
    )
    where teams.organization_id = ?`,
    [organizationId]
  );

  return teamToCampaigns;
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

  const generalAssignmentType = generalEnabled ? assignmentType : "NOTHING";
  const generalAssignmentBit = generalEnabled ? 1 : 0;

  const { rows: teamToCampaigns } = await trx.raw(
    /**
     * What a query!
     *
     * General is set to priority 0 here so that it shows up at the top of the page display
     */
    `
    select teams.title as team_title, teams.assignment_priority, teams.assignment_type, teams.is_assignment_enabled as enabled, teams.max_request_count, campaign.id, campaign.title
    from (
      select id, title, assignment_priority, assignment_type, organization_id, is_assignment_enabled, max_request_count from team
      union
      select 0, 'General', 'infinity'::float, '${generalAssignmentType}', ${organizationId}, '${generalAssignmentBit}'::boolean, ${orgMaxRequestCount}
    ) as teams
    join campaign on campaign.id = (
      select id
      from campaign
      where organization_id = teams.organization_id
        and is_started = true
        and is_archived = false
        and is_autoassign_enabled = true 
        and (
          limit_assignment_to_teams = false
          or exists (
            select 1
            from campaign_team
            where campaign_team.campaign_id = campaign.id
              and campaign_team.team_id = teams.id
          )
        )
        and exists (
          select 1
          from campaign_contact
          where campaign_id = campaign.id
            and assignment_id is null
            and message_status = (
              case
                when teams.assignment_type = 'UNSENT' then
                  'needsMessage'
                when teams.assignment_type = 'UNREPLIED' then
                  'needsResponse'
              end
            )
            and extract('hour' from current_timestamp at time zone coalesce(campaign_contact.timezone, campaign.timezone)) >= campaign.texting_hours_start
            and extract('hour' from (current_timestamp + interval '5 minutes') at time zone coalesce(campaign_contact.timezone, campaign.timezone)) < campaign.texting_hours_end
            and not exists (
              select 1
              from campaign_contact_tag
              join tag
                on tag.id = campaign_contact_tag.tag_id
                and campaign_contact_tag.campaign_contact_id = campaign_contact.id
              where tag.is_assignable = false
                and not exists (
                  select 1
                  from team_escalation_tags
                  where team_escalation_tags.tag_id = tag.id
                    and team_escalation_tags.team_id in (
                      select team_id
                      from user_team
                      where user_id = ?
                    )
                )
            )
        )
      order by id asc
    )
    where teams.organization_id = ?
      and (
        teams.id = 0 or
        exists (
          select 1
          from user_team
          where user_id = ?
            and team_id = teams.id
        )
      )
    `,
    [userId, organizationId, userId]
  );

  const results = teamToCampaigns.slice(0, 1).map(ttc =>
    Object.assign(ttc, {
      type: ttc.assignment_type,
      campaign: { id: ttc.id, title: ttc.title },
      count_left: 0
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

  const messageStatus = {
    UNSENT: "needsMessage",
    UNREPLIED: "needsResponse"
  }[assignmentInfo.assignment_type];

  const { rowCount: ccUpdateCount } = await trx.raw(
    `
      update
        campaign_contact as target_contact
      set
        assignment_id = ?
      from
        (
          select
            campaign_contact.id
          from
            campaign_contact
          join campaign on campaign.id = campaign_contact.id
          where
            campaign_id = ?
            and message_status = ?
            and assignment_id is null
            and extract('hour' from current_timestamp at time zone coalesce(campaign_contact.timezone, campaign.timezone)) >= campaign.texting_hours_start
            and extract('hour' from (current_timestamp + interval '5 minutes') at time zone coalesce(campaign_contact.timezone, campaign.timezone)) < campaign.texting_hours_end
            and not exists (
              select 1
              from campaign_contact_tag
              join tag
                on tag.id = campaign_contact_tag.tag_id
                and campaign_contact_tag.campaign_contact_id = campaign_contact.id
              where tag.is_assignable = false
                and not exists (
                  select 1
                  from team_escalation_tags
                  where team_escalation_tags.tag_id = tag.id
                    and team_escalation_tags.team_id in (
                      select team_id
                      from user_team
                      where user_id = ?
                    )
                )
            )
          order by (current_timestamp at time zone coalesce(campaign_contact.timezone, campaign.timezone)) asc
          limit ?
          for update skip locked
        ) matching_contact
      where
        target_contact.id = matching_contact.id
    `,
    [assignmentId, campaignIdToAssignTo, messageStatus, user.id, countToAssign]
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
