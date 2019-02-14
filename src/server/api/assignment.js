import { mapFieldsToModel } from './lib/utils'
import { Assignment, r, cacheableData } from '../models'
import { getOffsets, defaultTimezoneIsBetweenTextingHours } from '../../lib'
import _ from 'lodash'

export function addWhereClauseForContactsFilterMessageStatusIrrespectiveOfPastDue(
  queryParameter,
  messageStatusFilter
) {
  if (!messageStatusFilter) {
    return queryParameter
  }

  let query = queryParameter
  if (messageStatusFilter === 'needsMessageOrResponse') {
    query.whereIn('message_status', ['needsResponse', 'needsMessage'])
  } else {
    query = query.whereIn('message_status', messageStatusFilter.split(','))
  }
  return query
}

export function getContacts(assignment, contactsFilter, organization, campaign, forCount = false) {
  // / returns list of contacts eligible for contacting _now_ by a particular user
  const textingHoursEnforced = organization.texting_hours_enforced
  const textingHoursStart = organization.texting_hours_start
  const textingHoursEnd = organization.texting_hours_end

  // 24-hours past due - why is this 24 hours offset?
  const includePastDue = (contactsFilter && contactsFilter.includePastDue)
  const pastDue = (campaign.due_by
                   && Number(campaign.due_by) + 24 * 60 * 60 * 1000 < Number(new Date()))
  const config = { textingHoursStart, textingHoursEnd, textingHoursEnforced }

  if (campaign.override_organization_texting_hours) {
    const textingHoursStart = campaign.texting_hours_start
    const textingHoursEnd = campaign.texting_hours_end
    const textingHoursEnforced = campaign.texting_hours_enforced
    const timezone = campaign.timezone

    config.campaignTextingHours = { textingHoursStart, textingHoursEnd, textingHoursEnforced, timezone }
  }

  const [validOffsets, invalidOffsets] = getOffsets(config)
  if (!includePastDue && pastDue && contactsFilter && contactsFilter.messageStatus === 'needsMessage') {
    return []
  }

  let query = r.knex('campaign_contact').where({
    assignment_id: assignment.id
  })

  if (contactsFilter) {
    const validTimezone = contactsFilter.validTimezone
    if (validTimezone !== null) {
      if (validTimezone === true) {
        if (defaultTimezoneIsBetweenTextingHours(config)) {
          // missing timezone ok
          validOffsets.push('')
        }
        query = query.whereIn('timezone_offset', validOffsets)
      } else if (validTimezone === false) {
        if (!defaultTimezoneIsBetweenTextingHours(config)) {
          // missing timezones are not ok to text
          invalidOffsets.push('')
        }
        query = query.whereIn('timezone_offset', invalidOffsets)
      }
    }

    query = addWhereClauseForContactsFilterMessageStatusIrrespectiveOfPastDue(
      query,
      ((contactsFilter && contactsFilter.messageStatus) ||
       (pastDue
        // by default if asking for 'send later' contacts we include only those that need replies
        ? 'needsResponse'
        // we do not want to return closed/messaged
        : 'needsMessageOrResponse'))
    )

    if (Object.prototype.hasOwnProperty.call(contactsFilter, 'isOptedOut')) {
      query = query.where('is_opted_out', contactsFilter.isOptedOut)
    }
  }

  if (!forCount) {
    if (contactsFilter && contactsFilter.messageStatus === 'convo') {
      query = query.orderByRaw('message_status DESC, updated_at DESC')
    } else {
      query = query.orderByRaw('message_status DESC, updated_at')
    }
  }

  return query
}

export async function giveUserMoreTexts(auth0Id, count) {
  // Fetch DB info
  const [matchingUsers, campaignContactGroups] = await Promise.all([
    await r.knex("user").where({ auth0_id: auth0Id }), 
    await r.knex('campaign_contact')
      .select([
        'campaign_id',
        r.knex.raw('assignment_id is null as unassigned')
      ])
      .count('id as total_count')
      .groupBy('campaign_id')
      .groupByRaw('assignment_id is null')
  ])

  const user = matchingUsers[0];
  if (!user) {
    throw new Error(`No user found with id ${auth0Id}`)
  }

  // Process campaigns, extracting relevant info
  const campaignIds = campaignContactGroups.map(ccg => ccg.campaign_id)
  const campaignsInfo = campaignIds.map((acc, campaignId) => {
    const assignedBatch = campaignContactGroups.find(ccg => ccg.campaign_id === campaignId && ccg.unassigned == false);
    const unassignedBatch = campaignContactGroups.find(ccg => ccg.campaign_id === campaignId && ccg.unassigned == true);
    const assignedCount = assignedBatch ? parseInt(assignedBatch.total_count) : 0
    const unassignedCount = unassignedBatch ? parseInt(unassignedBatch.total_count) : 0

    return {
      id: campaignId, 
      assignmentProgress: assignedCount / (assignedCount + unassignedCount),
      leftUnassigned: unassignedCount
    }
  })

  // Determine which campaign to assign to
  let campaignIdToAssignTo;
  let countToAssign = count;
  const campaignsWithEnoughLeftUnassigned = campaignsInfo.filter(c => c.leftUnassigned >= count)
  if (campaignsWithEnoughLeftUnassigned.length == 0) {
    const campaignWithMostToAssignTo = _.sortBy(campaignsInfo, c => c.leftUnassigned).reverse();
    if (campaignWithMostToAssignTo[0].leftUnassigned == 0) {
      throw new Error('There are no campaigns left to assign a texter to')
    } else {
      campaignIdToAssignTo = campaignWithMostToAssignTo[0].id;
      countToAssign = campaignWithMostToAssignTo[0].leftUnassigned;
    }
  } else {
    campaignIdToAssignTo = _.sortBy(campaignsWithEnoughLeftUnassigned, c => c.assignmentProgress)[0].id;
  }

  // Assign a max of `count` contacts in `campaignIdToAssignTo` to `user`
  let numberOfAddedContacts;
  await r.knex.transaction(async trx => {
    let assignmentId;
    const existingAssignment = (await r.knex('assignment').where({
      user_id: user.id,
      campaign_id: campaignIdToAssignTo 
    }))[0]

    if (!existingAssignment) {
      const inserted = await r.knex('assignment').insert({
        user_id: user.id,
        campaign_id: campaignIdToAssignTo,
        max_contacts: countToAssign
      }).returning('*')
      const newAssignment = inserted[0];
      assignmentId = newAssignment.id;
    } else {
      assignmentId = existingAssignment.id;
      if (existingAssignment.max_contacts) {
        await r.knex('assignment').update({
          max_contacts: countToAssign + existingAssignment.max_contacts
        }).where({ id: existingAssignment.id })
      }
    }

    // Can do this in one query in Postgres, but in order
    // to do it in MySQL, we need to find the contacts first
    // and then update them by ID since MySQL doesn't support
    // `returning` on updates
    const contactsToUpdate = await r.knex('campaign_contact')
      .select('id')
      .where({
        assignment_id: null,
        campaign_id: campaignIdToAssignTo
      })
      .limit(countToAssign)

    const updated_result = await r.knex('campaign_contact')
      .whereIn('id', contactsToUpdate.map(c => c.id ))
      .update({ assignment_id: assignmentId })
    
    numberOfAddedContacts = contactsToUpdate.length
  })

  return numberOfAddedContacts;
}

export const resolvers = {
  Assignment: {
    ...mapFieldsToModel(['id', 'maxContacts'], Assignment),
    texter: async (assignment, _, { loaders }) => (
      assignment.texter
      ? assignment.texter
      : loaders.user.load(assignment.user_id)
    ),
    campaign: async (assignment, _, { loaders }) => loaders.campaign.load(assignment.campaign_id),
    contactsCount: async (assignment, { contactsFilter }) => {
      const campaign = await r.table('campaign').get(assignment.campaign_id)

      const organization = await r.table('organization').get(campaign.organization_id)

      return await r.getCount(getContacts(assignment, contactsFilter, organization, campaign, true))
    },
    contacts: async (assignment, { contactsFilter }) => {
      const campaign = await r.table('campaign').get(assignment.campaign_id)

      const organization = await r.table('organization').get(campaign.organization_id)
      return getContacts(assignment, contactsFilter, organization, campaign)
    },
    campaignCannedResponses: async assignment =>
      await cacheableData.cannedResponse.query({
        userId: '',
        campaignId: assignment.campaign_id
      }),
    userCannedResponses: async assignment =>
      await cacheableData.cannedResponse.query({
        userId: assignment.user_id,
        campaignId: assignment.campaign_id
      })
  }
}
