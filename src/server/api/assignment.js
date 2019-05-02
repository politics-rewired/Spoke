import { mapFieldsToModel } from "./lib/utils";
import { Assignment, r, cacheableData } from "../models";
import { getOffsets, defaultTimezoneIsBetweenTextingHours } from "../../lib";
import { Notifications, sendUserNotification } from "../notifications";
import _ from "lodash";
import request from 'superagent'

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
export async function getCurrentAssignmentType() {
  const organization = await r.knex('organization').select('features').where({ id: 1 }).first()
  const features = {}
  try {
    const parsed = JSON.parse(organization.features)
    Object.assign(features, parsed)
  } catch (ex) {
    // do nothing
  }
  return features.textRequestType
}

export async function currentAssignmentTarget() {
  const assignmentType = await getCurrentAssignmentType()

  const campaignContactStatus = {
    UNREPLIED: 'needsResponse',
    UNSENT: 'needsMessage'
  }[assignmentType]

  if (!campaignContactStatus) { return null }

  const eligibleCampaigns = await r.knex('campaign').where({
    is_started: true,
    is_archived: false,
    is_autoassign_enabled: true
  }).andWhere(
    r.knex.raw(`texting_hours_end > hour(CONVERT_TZ(UTC_TIMESTAMP(), 'UTC', campaign.timezone))`)
  )

  const hasContactsOfTypeToAssign = await Promise.all(eligibleCampaigns.map(async campaign => {
    const contacts = await r.knex('campaign_contact')
      .select('id')
      .where({
        assignment_id: null,
        message_status: campaignContactStatus,
        is_opted_out: false,
        campaign_id: campaign.id
      })
      .limit(1)

    return contacts.length > 0
  }))

  const assignableCampaigns = eligibleCampaigns.filter((_campaign, idx) => hasContactsOfTypeToAssign[idx])
  const campaign = assignableCampaigns[0]

  if (!campaign) return null

  return { type: assignmentType, campaign }
}

const ASSIGNMENT_COMPLETE_NOTIFICATION_URL = process.env.ASSIGNMENT_COMPLETE_NOTIFICATION_URL
async function notifyIfAllAssigned(type, user, count) {
  if (ASSIGNMENT_COMPLETE_NOTIFICATION_URL) {
    const assignmentTarget = await currentAssignmentTarget()
    if (assignmentTarget == null) {
      await request.post(ASSIGNMENT_COMPLETE_NOTIFICATION_URL).send({ type, user, count })
      console.log(`Notified about out of ${type} to assign`)
    } 
  } else {
    console.log('Not checking if assignments are available – ASSIGNMENT_COMPLETE_NOTIFICATION_URL is unset')
  }
}

export async function countLeft(assignmentType, campaign) {
  const campaignContactStatus = {
    UNREPLIED: 'needsResponse',
    UNSENT: 'needsMessage'
  }[assignmentType]
 
  const result = await r.parseCount(
    r.knex('campaign_contact')
      .count()
      .where({
        assignment_id: null,
        message_status: campaignContactStatus,
        campaign_id: campaign
      })
    )
  return result;
}

export async function giveUserMoreTexts(auth0Id, count) {
  console.log(`Starting to give ${auth0Id} ${count} texts`);
  // Fetch DB info
  const matchingUsers = await r.knex("user").where({ auth0_id: auth0Id })
  const user = matchingUsers[0];
  if (!user) {
    throw new Error(`No user found with id ${auth0Id}`);
  }
 
  const assignmentInfo = await currentAssignmentTarget()
  if (!assignmentInfo) {
    throw new Error('Could not find a suitable campaign to assign to.')
  }
  
  // Determine which campaign to assign to – optimize to pick winners
  let campaignIdToAssignTo = assignmentInfo.campaign.id
  let countToAssign = count;
  console.log(`Assigning ${countToAssign} on campaign ${campaignIdToAssignTo} of type ${assignmentInfo.type}`)

  // Assign a max of `count` contacts in `campaignIdToAssignTo` to `user`
  const updated_result = await r.knex.transaction(async trx => {
    let assignmentId;
    const existingAssignment = (await r.knex("assignment").where({
      user_id: user.id,
      campaign_id: campaignIdToAssignTo
    }))[0];

    if (!existingAssignment) {
      const inserted = await r
        .knex("assignment")
        .insert({
          user_id: user.id,
          campaign_id: campaignIdToAssignTo,
          max_contacts: countToAssign
        })
        .returning("*");
      console.log(inserted);
      assignmentId = inserted[0]
        ? inserted[0].id
          ? inserted[0].id
          : inserted[0]
        : inserted.id;
    } else {
      assignmentId = existingAssignment.id;
    }

    console.log(`Assigning to assignment id ${assignmentId}`)

    let countToAssign = count;
    // Can do this in one query in Postgres, but in order
    // to do it in MySQL, we need to find the contacts first
    // and then update them by ID since MySQL doesn't support
    // `returning` on updates
    // NVM! Doing this in one query to avoid concurrency issues,
    // and instead not returning the count

    const campaignContactStatus = {
      UNREPLIED: 'needsResponse',
      UNSENT: 'needsMessage'
    }[assignmentInfo.type]

    const ids = await r
      .knex("campaign_contact")
      .select("id")
      .where({
        assignment_id: null,
        campaign_id: campaignIdToAssignTo,
        message_status: campaignContactStatus,
        is_opted_out: false
      })
      .limit(countToAssign)
      .map(c => c.id);
    
    console.log(`Found ${ids.length} to assign`)

    const { campaign_contacts_updated_result, messages_updated_result } = await r.knex.transaction(async trx => {
      const campaign_contacts_updated_result = await trx("campaign_contact")
        .update({ assignment_id: assignmentId })
        .update({ updated_at: r.knex.fn.now() })
        .whereIn("id", ids);

      const messages_updated_result = await trx('message')
        .update({
          assignment_id: assignmentId,
        })
        .whereIn('campaign_contact_id', ids)

      return { campaign_contacts_updated_result, messages_updated_result }
    })

    console.log(`Updated ${campaign_contacts_updated_result} campaign contacts and ${messages_updated_result} messages.`)
    return campaign_contacts_updated_result
  });

  // Async function, not awaiting because response to TFB does not depend on it
  notifyIfAllAssigned(assignmentInfo.type, auth0Id, countToAssign)

  return updated_result
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
