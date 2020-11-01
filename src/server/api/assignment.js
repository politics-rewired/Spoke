import _ from "lodash";
import request from "superagent";

import { config } from "../../config";
import { isNowBetween } from "../../lib/timezones";
import { sleep } from "../../lib/utils";
import logger from "../../logger";
import { eventBus, EventType } from "../event-bus";
import { cacheOpts, memoizer } from "../memoredis";
import { cacheableData, r } from "../models";
import { sqlResolvers } from "./lib/utils";

class AutoassignError extends Error {
  constructor(message, isFatal = false) {
    super(message);
    this.isFatal = isFatal;
  }
}

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
 * Given query parameters, an assignment record, and its associated records, build a Knex query
 * to fetch contacts eligible for contacting _now_ by a particular user given filter constraints.
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
  // 24-hours past due - why is this 24 hours offset?
  const includePastDue = contactsFilter && contactsFilter.includePastDue;
  const pastDue =
    campaign.due_by &&
    Number(campaign.due_by) + 24 * 60 * 60 * 1000 < Number(new Date());

  if (
    !includePastDue &&
    pastDue &&
    contactsFilter &&
    contactsFilter.messageStatus === "needsMessage"
  ) {
    return [];
  }

  let query = r
    .reader("campaign_contact")
    .where({
      campaign_id: campaign.id,
      assignment_id: assignment.id
    })
    .whereRaw(`archived = ${campaign.is_archived}`); // partial index friendly

  if (contactsFilter) {
    const { validTimezone } = contactsFilter;
    if (validTimezone !== null) {
      const {
        texting_hours_start: textingHoursStart,
        texting_hours_end: textingHoursEnd,
        timezone: campaignTimezone
      } = campaign;

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
    .where({ id: parseInt(organizationId, 10) })
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
  const { rows: teamToCampaigns } = await r.reader.raw(
    /**
     * What a query!
     *
     * General is set to priority 0 here so that it shows up at the top of the page display
     * @> is the Postgresql array includes operator
     * ARRAY[1,2,3] @> ARRAY[1,2] is true
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
      select
        team_assignment_options.*,
        (
          select array_agg(tag_id)
          from team_escalation_tags
          where team_id = team_assignment_options.id
        ) as this_teams_escalation_tags
      from team_assignment_options
      where assignment_type = 'UNREPLIED'
    ),
    needs_message_team_campaign_pairings as (
      select
          teams.assignment_priority as priority,
          teams.id as team_id,
          teams.title as team_title,
          teams.is_assignment_enabled as enabled,
          teams.assignment_type,
          campaign.id as id, campaign.title
      from needs_message_teams as teams
      join campaign on campaign.id = (
        select id
        from assignable_campaigns_with_needs_message as campaigns
        where campaigns.id in (
          select campaign_id
          from campaign_team
          where team_id = teams.id
        )
        order by id asc
        limit 1
      )
    ),
    needs_reply_team_campaign_pairings as (
      select
          teams.assignment_priority as priority,
          teams.id as team_id,
          teams.title as team_title,
          teams.is_assignment_enabled as enabled,
          teams.assignment_type,
          campaign.id as id, campaign.title
      from needs_reply_teams as teams
      join campaign on campaign.id = (
        select id
        from assignable_campaigns_with_needs_reply as campaigns
        where campaigns.id in (
          select campaign_id
          from campaign_team
          where team_id = teams.id
        )
        order by id asc
        limit 1
      )
    ),
    custom_escalation_campaign_pairings as (
      select
        teams.assignment_priority as priority,
        teams.id as team_id,
        teams.title as team_title,
        teams.is_assignment_enabled as enabled,
        teams.assignment_type,
        campaign.id as id, campaign.title
      from needs_reply_teams as teams
      join campaign on campaign.id = (
        select id
        from assignable_campaigns as campaigns
        where exists (
          select 1
          from assignable_needs_reply_with_escalation_tags
          where campaign_id = campaigns.id
            and teams.this_teams_escalation_tags @> applied_escalation_tags
            -- @> is true if teams.this_teams_escalation_tags has every member of applied_escalation_tags
        )
        and (
          campaigns.limit_assignment_to_teams = false
          or
          exists (
            select 1
            from campaign_team
            where campaign_team.team_id = teams.id
              and campaign_team.campaign_id = campaigns.id
          )
        )
        order by id asc
        limit 1
      )
    ),
    general_campaign_pairing as (
      select
        0 as priority, -1 as team_id, 'General' as team_title,
        ${generalEnabledBit}::boolean as enabled,
        '${assignmentType}' as assignment_type,
        campaigns.id, campaigns.title
      from ${campaignView} as campaigns
      where campaigns.limit_assignment_to_teams = false
          and organization_id = ?
      order by id asc
      limit 1
    ),
    all_campaign_pairings as (
      (
        select needs_message_team_campaign_pairings.*, (
          select count(*)
          from assignable_needs_message
          where campaign_id = needs_message_team_campaign_pairings.id
        ) as count_left
        from needs_message_team_campaign_pairings
      )
      union
      (
        select needs_reply_team_campaign_pairings.*, (
          select count(*)
          from assignable_needs_reply
          where campaign_id = needs_reply_team_campaign_pairings.id
        ) as count_left
        from needs_reply_team_campaign_pairings
        where team_id not in (
          select team_id
          from custom_escalation_campaign_pairings
        )
      )
      union
      (
        select custom_escalation_campaign_pairings.*, (
          select count(distinct id)
          from 
          (
            (
              select id
              from assignable_needs_reply
              where campaign_id = custom_escalation_campaign_pairings.id
            ) union (
              select id
              from assignable_needs_reply_with_escalation_tags
              where campaign_id = custom_escalation_campaign_pairings.id
            )
          ) all_assignable_for_campaign
        ) as count_left
        from custom_escalation_campaign_pairings
      )
      union
      (
        select general_campaign_pairing.*, (
          select count(*)
          from ${contactsView}
          where campaign_id = general_campaign_pairing.id
        ) as count_left
        from general_campaign_pairing
      )
    )
    select *
    from all_campaign_pairings
    order by priority asc`,
    [organizationId, organizationId]
  );

  return teamToCampaigns;
}

const memoizedMyCurrentAssignmentTargets = memoizer.memoize(
  async ({
    myTeamIds,
    myEscalationTags,
    generalEnabledBit,
    campaignView,
    orgMaxRequestCount,
    assignmentType,
    organizationId
  }) => {
    const { rows: teamToCampaigns } = await r.reader.raw(
      /**
       * This query is the same as allCurrentAssignmentTargets, except
       *  - it restricts teams to those with is_assignment_enabled = true via the where clause in team_assignment_options
       *  - it adds all_possible_team_assignments to set up my_possible_team_assignments
       *
       * @> is the Postgresql array includes operator
       * ARRAY[1,2,3] @> ARRAY[1,2] is true
       */
      `
      with needs_message_teams as (
        select * from team
        where assignment_type = 'UNSENT'
          and id = ANY(?)
      ),
      needs_reply_teams as (
        select * from team
        where assignment_type = 'UNREPLIED'
          and id = ANY(?)
      ),
      needs_message_team_campaign_pairings as (
        select
            teams.assignment_priority as priority,
            teams.id as team_id,
            teams.title as team_title,
            teams.is_assignment_enabled as enabled,
            teams.assignment_type,
            teams.max_request_count,
            campaign.id as id, campaign.title
        from needs_message_teams as teams
        join campaign on campaign.id = (
          select id
          from assignable_campaigns_with_needs_message as campaigns
          where campaigns.id in (
            select campaign_id
            from campaign_team
            where team_id = teams.id
          )
          order by id asc
          limit 1
        )
      ),
      needs_reply_team_campaign_pairings as (
        select
            teams.assignment_priority as priority,
            teams.id as team_id,
            teams.title as team_title,
            teams.is_assignment_enabled as enabled,
            teams.assignment_type,
            teams.max_request_count,
            campaign.id as id, campaign.title
        from needs_reply_teams as teams
        join campaign on campaign.id = (
          select id
          from assignable_campaigns_with_needs_reply as campaigns
          where campaigns.id in (
            select campaign_id
            from campaign_team
            where team_id = teams.id
          )
          order by id asc
          limit 1
        )
      ),
      custom_escalation_campaign_pairings as (
        select
          teams.assignment_priority as priority,
          teams.id as team_id,
          teams.title as team_title,
          teams.is_assignment_enabled as enabled,
          teams.assignment_type,
          teams.max_request_count,
          campaign.id as id, campaign.title
        from needs_reply_teams as teams
        join campaign on campaign.id = (
          select id
          from assignable_campaigns as campaigns
          where exists (
            select 1
            from assignable_needs_reply_with_escalation_tags
            where campaign_id = campaigns.id
              and ? @> applied_escalation_tags
              and (
                campaigns.limit_assignment_to_teams = false
                or
                exists (
                  select 1
                  from campaign_team
                  where campaign_team.team_id = teams.id
                    and campaign_team.campaign_id = campaigns.id
                )
              )
            )
          order by id asc
          limit 1
        )
      ),
      general_campaign_pairing as (
        select
          '+infinity'::float as priority, -1 as team_id, 
          'General' as team_title, 
          ${generalEnabledBit}::boolean as enabled, 
          '${assignmentType}' as assignment_type, 
          ${orgMaxRequestCount} as max_request_count,
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
        union
        ( select * from custom_escalation_campaign_pairings )
        union
        ( select * from general_campaign_pairing )
      )
      select * from all_possible_team_assignments
      where enabled = true
      order by priority, id asc`,
      [myTeamIds, myTeamIds, myEscalationTags, organizationId]
    );

    const results = teamToCampaigns.map(ttc =>
      Object.assign(ttc, {
        type: ttc.assignment_type,
        campaign: { id: ttc.id, title: ttc.title },
        count_left: 0
      })
    );

    return results;
  },
  cacheOpts.MyCurrentAssignmentTargets
);

export async function cachedMyCurrentAssignmentTargets(userId, organizationId) {
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
    return [];
  }

  const generalEnabledBit = generalEnabled ? 1 : 0;

  const myTeamIds = await r
    .reader("team")
    .join("user_team", "team.id", "=", "user_team.team_id")
    .where({
      user_id: parseInt(userId, 10),
      is_assignment_enabled: true,
      organization_id: parseInt(organizationId, 10)
    })
    .pluck("id");

  const myEscalationTags = await r
    .reader("team_escalation_tags")
    .whereIn("team_id", myTeamIds)
    .pluck("tag_id");

  return memoizedMyCurrentAssignmentTargets({
    myTeamIds,
    myEscalationTags,
    generalEnabledBit,
    campaignView,
    contactsView,
    orgMaxRequestCount,
    assignmentType,
    organizationId
  });
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
    return [];
  }

  const generalEnabledBit = generalEnabled ? 1 : 0;

  const { rows: teamToCampaigns } = await trx.raw(
    /**
     * This query is the same as allCurrentAssignmentTargets, except
     *  - it restricts teams to those with is_assignment_enabled = true via the where clause in team_assignment_options
     *  - it adds all_possible_team_assignments to set up my_possible_team_assignments
     *
     * @> is the Postgresql array includes operator
     * ARRAY[1,2,3] @> ARRAY[1,2] is true
     */
    `
      with team_assignment_options as (
        select *
        from team
        where organization_id = ?
          and is_assignment_enabled = true
          and exists (
            select 1
            from user_team
            where team_id = team.id
              and user_id = ?
          )         
      ),
      my_escalation_tags as (
        select array_agg(tag_id) as my_escalation_tags
        from team_escalation_tags
        where exists (
          select 1
          from user_team
          where user_team.team_id = team_escalation_tags.team_id
            and user_id = ?
        )
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
            teams.assignment_priority as priority,
            teams.id as team_id,
            teams.title as team_title,
            teams.is_assignment_enabled as enabled,
            teams.assignment_type,
            teams.max_request_count,
            campaign.id as id, campaign.title
        from needs_message_teams as teams
        join campaign on campaign.id = (
          select id
          from assignable_campaigns_with_needs_message as campaigns
          where campaigns.id in (
            select campaign_id
            from campaign_team
            where team_id = teams.id
          )
          order by id asc
          limit 1
        )
      ),
      needs_reply_team_campaign_pairings as (
        select
            teams.assignment_priority as priority,
            teams.id as team_id,
            teams.title as team_title,
            teams.is_assignment_enabled as enabled,
            teams.assignment_type,
            teams.max_request_count,
            campaign.id as id, campaign.title
        from needs_reply_teams as teams
        join campaign on campaign.id = (
          select id
          from assignable_campaigns_with_needs_reply as campaigns
          where campaigns.id in (
            select campaign_id
            from campaign_team
            where team_id = teams.id
          )
          order by id asc
          limit 1
        )
      ),
      custom_escalation_campaign_pairings as (
        select
          teams.assignment_priority as priority,
          teams.id as team_id,
          teams.title as team_title,
          teams.is_assignment_enabled as enabled,
          teams.assignment_type,
          teams.max_request_count,
          campaign.id as id, campaign.title
        from needs_reply_teams as teams
        join campaign on campaign.id = (
          select id
          from assignable_campaigns as campaigns
          where exists (
            select 1
            from assignable_needs_reply_with_escalation_tags
            join my_escalation_tags on true
            where campaign_id = campaigns.id
              and my_escalation_tags.my_escalation_tags @> applied_escalation_tags
              and (
                campaigns.limit_assignment_to_teams = false
                or
                exists (
                  select 1
                  from campaign_team
                  where campaign_team.team_id = teams.id
                    and campaign_team.campaign_id = campaigns.id
                )
              )
            )
          order by id asc
          limit 1
        )
      ),
      general_campaign_pairing as (
        select
          '+infinity'::float as priority, -1 as team_id, 
          'General' as team_title, 
          ${generalEnabledBit}::boolean as enabled, 
          '${assignmentType}' as assignment_type, 
          ${orgMaxRequestCount} as max_request_count,
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
        union
        ( select * from custom_escalation_campaign_pairings )
        union
        ( select * from general_campaign_pairing )
      )
      select * from all_possible_team_assignments
      where enabled = true
      order by priority, id asc`,
    [organizationId, userId, userId, organizationId]
  );

  const results = teamToCampaigns.map(ttc =>
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
  return options.length > 0 ? options[0] : null;
}

async function notifyIfAllAssigned(organizationId, teamsAssignedTo) {
  const doNotification = memoizer.memoize(
    async ({ team }) =>
      request
        .post(config.ASSIGNMENT_COMPLETE_NOTIFICATION_URL)
        .timeout(30000)
        .send({ team }),
    cacheOpts.AssignmentCompleteLock
  );

  if (config.ASSIGNMENT_COMPLETE_NOTIFICATION_URL) {
    const assignmentTargets = await allCurrentAssignmentTargets(organizationId);
    const existingTeamIds = assignmentTargets.map(cat => cat.team_id);

    const isEmptiedTeam = ([id, _title]) => !existingTeamIds.includes(id);
    let emptiedTeams = [...teamsAssignedTo.entries()].filter(isEmptiedTeam);

    let notificationTeamIds = config.ASSIGNMENT_COMPLETE_NOTIFICATION_TEAM_IDS;
    if (notificationTeamIds.length > 0) {
      notificationTeamIds = notificationTeamIds.split(",").map(parseInt);
      const isANotifyTeam = ([id, _title]) => notificationTeamIds.includes(id);
      emptiedTeams = emptiedTeams.filter(isANotifyTeam);
    }

    await Promise.all(
      emptiedTeams.map(([_id, title]) => doNotification({ team: title }))
    );
  } else {
    logger.verbose(
      "Not checking if assignments are available – ASSIGNMENT_COMPLETE_NOTIFICATION_URL is unset"
    );
  }
}

export async function assignLoop(
  user,
  organizationId,
  countLeft,
  preferredTeamId,
  trx
) {
  const assignmentOptions = await myCurrentAssignmentTargets(
    user.id,
    organizationId,
    trx
  );

  if (assignmentOptions.length === 0) {
    return { count: 0 };
  }

  const preferredAssignment = assignmentOptions.find(
    assignment => assignment.team_id === preferredTeamId
  );

  const assignmentInfo = preferredAssignment || assignmentOptions[0];

  // Determine which campaign to assign to – optimize to pick winners
  const campaignIdToAssignTo = assignmentInfo.campaign.id;
  const countToAssign = Math.min(
    countLeft,
    parseInt(assignmentInfo.max_request_count, 10)
  );

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
    const [newAssignment] = await trx("assignment")
      .insert({
        user_id: user.id,
        campaign_id: campaignIdToAssignTo
      })
      .returning("*");
    eventBus.emit(EventType.AssignmentCreated, newAssignment);
    assignmentId = newAssignment.id;
  } else {
    assignmentId = existingAssignment.id;
  }

  logger.verbose(`Assigning to assignment id ${assignmentId}`);

  const myEscalationTags = await r
    .reader("team_escalation_tags")
    .whereIn(
      "team_id",
      r
        .reader("team")
        .select("team.id")
        .join("user_team", "team.id", "=", "user_team.team_id")
        .where({
          user_id: parseInt(user.id, 10),
          is_assignment_enabled: true,
          organization_id: parseInt(organizationId, 10)
        })
    )
    .pluck("tag_id");

  if (myEscalationTags.length > 0) {
    const { rowCount: ccUpdateCount } = await trx.raw(
      `
      with matching_contact as (
        select id from assignable_campaign_contacts_with_escalation_tags
        where campaign_id = ?
          
          and ? @> applied_escalation_tags
        for update skip locked
        limit ?
      )
      update
         campaign_contact as target_contact
       set
         assignment_id = ?
       from
         matching_contact
       where
         target_contact.id = matching_contact.id;`,
      [campaignIdToAssignTo, myEscalationTags, countToAssign, assignmentId]
    );

    if (ccUpdateCount > 0) {
      logger.verbose(`Updated ${ccUpdateCount} campaign contacts`);
      const team = {
        teamId: assignmentInfo.team_id,
        teamTitle: assignmentInfo.team_title
      };
      return { count: ccUpdateCount, team };
    }
  }

  const contactView = {
    UNREPLIED: `assignable_needs_reply`,
    UNSENT: "assignable_needs_message"
  }[assignmentInfo.type];

  const { rowCount: ccUpdateCount } = await trx.raw(
    `
      with matching_contact as (
        select id from ${contactView}
        where campaign_id = ?
        -- for update skip locked
        limit ?
      )
      update
         campaign_contact as target_contact
       set
         assignment_id = ?
       from
         matching_contact
       where
         target_contact.id = matching_contact.id;`,
    [campaignIdToAssignTo, countToAssign, assignmentId]
  );

  logger.verbose(`Updated ${ccUpdateCount} campaign contacts`);
  const team = {
    teamId: assignmentInfo.team_id,
    teamTitle: assignmentInfo.team_title
  };

  return { count: ccUpdateCount, team };
}

export async function giveUserMoreTexts(
  userId,
  count,
  organizationId,
  preferredTeamId,
  parentTrx = r.knex
) {
  logger.verbose(`Starting to give ${userId} ${count} texts`);

  const matchingUsers = await r.knex("user").where({ id: userId });
  const user = matchingUsers[0];
  if (!user) {
    throw new AutoassignError(`No user found with id ${userId}`);
  }

  const assignmentOptions = await myCurrentAssignmentTargets(
    user.id,
    organizationId,
    parentTrx
  );

  if (assignmentOptions.length === 0) {
    return 0;
  }

  const preferredAssignment = assignmentOptions.find(
    assignment => assignment.team_id === preferredTeamId
  );

  const assignmentInfo = preferredAssignment || assignmentOptions[0];

  if (!assignmentInfo) {
    throw new AutoassignError(
      "Could not find a suitable campaign to assign to."
    );
  }

  // Use a Map to de-duplicate and support integer-type keys
  const teamsAssignedTo = new Map();
  let countUpdated = 0;
  let countLeftToUpdate = Math.min(count, assignmentInfo.max_request_count);

  const updated_result = await parentTrx.transaction(async trx => {
    while (countLeftToUpdate > 0) {
      const { count: countUpdatedInLoop, team } = await assignLoop(
        user,
        organizationId,
        countLeftToUpdate,
        preferredTeamId,
        trx
      );

      countLeftToUpdate = config.DISABLE_ASSIGNMENT_CASCADE
        ? 0
        : countLeftToUpdate - countUpdatedInLoop;

      countUpdated += countUpdatedInLoop;
      if (countUpdatedInLoop === 0) {
        if (countUpdated === 0) {
          throw new AutoassignError(
            "Could not find a suitable campaign to assign to."
          );
        } else {
          return countUpdated;
        }
      }

      const { teamId, teamTitle } = team;
      teamsAssignedTo.set(teamId, teamTitle);
    }

    return countUpdated;
  });

  if (teamsAssignedTo.size > 0) {
    // Hold off notifying until the current transaction has commited and propagated to any readers
    // No need to await the notify result as giveUserMoreTexts doesn't depend on it
    sleep(15000)
      .then(() => notifyIfAllAssigned(organizationId, teamsAssignedTo))
      .catch(err =>
        logger.error("Encountered error notifying assignment complete: ", err)
      );
  }

  return updated_result;
}

export async function fulfillPendingRequestFor(auth0Id) {
  const user = await r
    .knex("user")
    .first("id")
    .where({ auth0_id: auth0Id });

  if (!user) {
    throw new AutoassignError(`No user found with id ${auth0Id}`);
  }

  // External assignment service may not be organization-aware so we default to the highest organization ID
  const pendingAssignmentRequest = await r
    .knex("assignment_request")
    .where({ status: "pending", user_id: user.id })
    .orderBy("organization_id", "desc")
    .first("*");

  if (!pendingAssignmentRequest) {
    throw new AutoassignError(`No pending request exists for ${auth0Id}`);
  }

  const doAssignment = memoizer.memoize(
    async ({ pendingAssignmentRequestId: _ignore }) => {
      const numberAssigned = await r.knex.transaction(async trx => {
        try {
          const result = await giveUserMoreTexts(
            pendingAssignmentRequest.user_id,
            pendingAssignmentRequest.amount,
            pendingAssignmentRequest.organization_id,
            pendingAssignmentRequest.preferred_team_id,
            trx
          );

          await trx("assignment_request")
            .update({
              status: "approved"
            })
            .where({ id: pendingAssignmentRequest.id });

          return result;
        } catch (err) {
          logger.info(
            `Failed to give user ${auth0Id} more texts. Marking their request as rejected. `,
            err
          );

          // Mark as rejected outside the transaction so it is unaffected by the rollback
          await r
            .knex("assignment_request")
            .update({
              status: "rejected"
            })
            .where({ id: pendingAssignmentRequest.id });

          const isFatal = err.isFatal !== undefined ? err.isFatal : true;
          throw new AutoassignError(err.message, isFatal);
        }
      });

      return numberAssigned;
    },
    cacheOpts.FullfillAssignmentLock
  );

  return doAssignment({
    pendingAssignmentRequestId: pendingAssignmentRequest.id
  });
}

export async function autoHandleRequest(pendingAssignmentRequest) {
  // check texter status of pendingAssignmentRequest
  const user_organization = await r
    .knex("user_organization")
    .where({
      user_id: pendingAssignmentRequest.user_id,
      organization_id: pendingAssignmentRequest.organization_id
    })
    .first("*");

  if (user_organization) {
    if (user_organization.request_status === "auto_approve") {
      // Even if the assignment fails, we still want to approve their request
      // to let them request again if possible
      try {
        await giveUserMoreTexts(
          pendingAssignmentRequest.user_id,
          pendingAssignmentRequest.amount,
          pendingAssignmentRequest.organization_id,
          pendingAssignmentRequest.preferred_team_id
        );
      } catch (ex) {
        logger.error("Error assigning: ", ex);
      } finally {
        await r
          .knex("assignment_request")
          .update({ status: "approved" })
          .where({ id: pendingAssignmentRequest.id });
      }
    }

    if (user_organization.request_status === "do_not_approve") {
      await r
        .knex("assignment_request")
        .update({ status: "rejected" })
        .where({ id: pendingAssignmentRequest.id });
    }
  }
}

const getContactsCountFromShadowCounts = (shadowCounts, contactsFilter) => {
  const countsPassingContactsFilter = shadowCounts.filter(
    ({ message_status, is_opted_out, contact_is_textable_now }) => {
      if (!contactsFilter) {
        return true;
      }

      if (contactsFilter.validTimezone !== null) {
        if (
          contactsFilter.validTimezone === true &&
          contact_is_textable_now === false
        ) {
          return false;
        }

        if (
          contactsFilter.validTimezone === false &&
          contact_is_textable_now === true
        ) {
          return false;
        }
      }

      if (contactsFilter.messageStatus) {
        if (contactsFilter.messageStatus === "needsMessageOrResponse") {
          if (
            message_status !== "needsResponse" ||
            message_status !== "needsMessage"
          ) {
            return false;
          }
        }

        const messageStatusOptions = contactsFilter.messageStatus.split(",");
        if (!messageStatusOptions.includes(message_status)) {
          return false;
        }
      }

      if ("isOptedOut" in contactsFilter && contactsFilter.isOptedOut != null) {
        if (is_opted_out !== contactsFilter.isOptedOut) {
          return false;
        }
      }

      return true;
    }
  );

  return countsPassingContactsFilter.reduce(
    (acc, c) => acc + parseInt(c.count, 10),
    0
  );
};

export const resolvers = {
  Assignment: {
    ...sqlResolvers(["id", "maxContacts"]),
    texter: async (assignment, _ignore, { loaders }) =>
      assignment.texter
        ? assignment.texter
        : loaders.user.load(assignment.user_id),
    campaign: async assignment => {
      const getCampaign = memoizer.memoize(async ({ campaignId }) => {
        return r
          .reader("campaign")
          .where({ id: campaignId })
          .first("*");
      }, cacheOpts.CampaignOne);

      return getCampaign({ campaignId: assignment.campaign_id });
    },
    contactsCount: async (assignment, { contactsFilter }) => {
      if ("shadowCounts" in assignment) {
        return getContactsCountFromShadowCounts(
          assignment.shadowCounts,
          contactsFilter
        );
      }

      const campaign = await r
        .reader("campaign")
        .where({ id: assignment.campaign_id })
        .first();
      const organization = await r
        .reader("organization")
        .where({ id: campaign.organization_id })
        .first();

      return r.getCount(
        getContacts(assignment, contactsFilter, organization, campaign, true)
      );
    },
    contacts: async (assignment, { contactsFilter }) => {
      const campaign = await r
        .reader("campaign")
        .where({ id: assignment.campaign_id })
        .first();

      const organization = await r
        .reader("organization")
        .where({ id: campaign.organization_id })
        .first();
      return getContacts(assignment, contactsFilter, organization, campaign);
    },
    campaignCannedResponses: async assignment => {
      const getCannedResponses = memoizer.memoize(
        async ({ campaignId, userId }) => {
          return cacheableData.cannedResponse.query({
            userId: userId || "",
            campaignId
          });
        },
        cacheOpts.CampaignCannedResponses
      );

      return getCannedResponses({ campaignId: assignment.campaign_id });
    },
    userCannedResponses: async _assignment => {
      return [];
    }
  }
};
