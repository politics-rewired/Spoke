import _ from 'lodash'
import { Assignment, r } from '../models'
import { addWhereClauseForContactsFilterMessageStatusIrrespectiveOfPastDue } from './assignment'
import { buildCampaignQuery } from './campaign'
import { log } from '../../lib'

function getConversationsJoinsAndWhereClause(
  queryParam,
  organizationId,
  campaignsFilter,
  assignmentsFilter,
  contactsFilter,
  contactNameFilter
) {
  let query = queryParam
    .leftJoin('campaign_contact', 'campaign.id', 'campaign_contact.campaign_id')
    .leftJoin('assignment', 'campaign_contact.assignment_id', 'assignment.id')
    .leftJoin('user', 'assignment.user_id', 'user.id')
    .where({ 'campaign.organization_id': organizationId })

  query = buildCampaignQuery(query, organizationId, campaignsFilter)

  if (assignmentsFilter) {
    if ('texterId' in assignmentsFilter && assignmentsFilter.texterId !== null)
      query = query.where({ 'assignment.user_id': assignmentsFilter.texterId })
  }

  if (contactNameFilter) {
    if (contactNameFilter.firstName) 
      query = query.where('campaign_contact.first_name', 'like', `${contactNameFilter.firstName}%`)
    if (contactNameFilter.lastName) 
      query = query.where('campaign_contact.last_name', 'like', `${contactNameFilter.lastName}%`)
  }

  query = addWhereClauseForContactsFilterMessageStatusIrrespectiveOfPastDue(
    query,
    contactsFilter && contactsFilter.messageStatus)

  if (contactsFilter && 'isOptedOut' in contactsFilter) {
    const subQuery = (r.knex.select('cell')
      .from('opt_out')
      .whereRaw('opt_out.cell=campaign_contact.cell'))
    if (contactsFilter.isOptedOut) {
      query = query.whereExists(subQuery)
    } else {
      query = query.whereNotExists(subQuery)
    }
  }

  return query
}

/*
This is necessary because the SQL query that provides the data for this resolver
is a join across several tables with non-unique column names.  In the query, we
alias the column names to make them unique.  This function creates a copy of the
results, replacing keys in the fields map with the original column name, so the
results can be consumed by downstream resolvers.
 */
function mapQueryFieldsToResolverFields(queryResult, fieldsMap) {
  return _.mapKeys(queryResult, (value, key) => {
    const newKey = fieldsMap[key]
    if (newKey) {
      return newKey
    }
    return key
  })
}

export async function getConversations(
  cursor,
  organizationId,
  campaignsFilter,
  assignmentsFilter,
  contactsFilter,
  contactNameFilter,
  utc
) {
  /* Query #1 == get campaign_contact.id for all the conversations matching
  * the criteria with offset and limit. */
  let offsetLimitQuery = r.knex.select('campaign_contact.id as cc_id')

  offsetLimitQuery = getConversationsJoinsAndWhereClause(
    offsetLimitQuery,
    organizationId,
    campaignsFilter,
    assignmentsFilter,
    contactsFilter,
    contactNameFilter
  )

  offsetLimitQuery = offsetLimitQuery
    .orderBy('campaign_contact.updated_at', 'DESC')
    .orderBy('cc_id')
  offsetLimitQuery = offsetLimitQuery.limit(cursor.limit).offset(cursor.offset)

  const ccIdRows = await offsetLimitQuery
  const ccIds = ccIdRows.map((ccIdRow) => {
    return ccIdRow.cc_id
  })

  /* Query #2 -- get all the columns we need, including messages, using the
  * cc_ids from Query #1 to scope the results to limit, offset */
  let query = r.knex.select(
    'campaign_contact.id as cc_id',
    'campaign_contact.first_name as cc_first_name',
    'campaign_contact.last_name as cc_last_name',
    'campaign_contact.cell',
    'campaign_contact.message_status',
    'campaign_contact.is_opted_out',
    'campaign_contact.updated_at',
    'campaign_contact.assignment_id',
    'opt_out.cell as opt_out_cell',
    'user.id as u_id',
    'user.first_name as u_first_name',
    'user.last_name as u_last_name',
    'campaign.id as cmp_id',
    'campaign.title',
    'campaign.due_by',
    'assignment.id as ass_id',
    'message.id as mess_id',
    'message.text',
    'message.user_number',
    'message.contact_number',
    'message.created_at',
    'message.is_from_contact'
  )

  query = getConversationsJoinsAndWhereClause(
    query,
    organizationId,
    campaignsFilter,
    assignmentsFilter,
    contactsFilter,
    contactNameFilter
  )

  query = query.whereIn('campaign_contact.id', ccIds)

  query = query.leftJoin('message', table => {
    table
      .on('message.assignment_id', '=', 'assignment.id')
      .andOn('message.contact_number', '=', 'campaign_contact.cell')
  })

  // Sorting has already happened in Query 1 and will happen in the JS grouping below
  query = query
    .leftJoin('opt_out', table => {
      table
        .on('opt_out.organization_id', '=',  'campaign.organization_id')
        .andOn('campaign_contact.cell', 'opt_out.cell')
    })

  const conversationRows = await query

  /* collapse the rows to produce an array of objects, with each object
  * containing the fields for one conversation, each having an array of
  * message objects */
  const messageFields = [
    'mess_id',
    'text',
    'user_number',
    'contact_number',
    'created_at',
    'is_from_contact'
  ]

  const groupedContacts = _.groupBy(conversationRows, 'cc_id')
  const conversations = Object.keys(groupedContacts)
    .map(contactId => {
      const contactMessages = groupedContacts[contactId]
      const firstRow = contactMessages[0]
      const conversation = _.omit(firstRow, messageFields)
      conversation.messages = contactMessages
        // Sort ASC to display most recent _messages_ last
        .sort((messageA, messageB) => messageA.created_at - messageB.created_at)
        .map(message => {
          return mapQueryFieldsToResolverFields(_.pick(message, messageFields), { mess_id: 'id' })
        })
      return conversation
    })
    // Sort DESC to display most recent _conversations_ first
    .sort((convA, convB) => convB.updated_at - convA.updated_at)

  /* Query #3 -- get the count of all conversations matching the criteria.
  * We need this to show total number of conversations to support paging */
  const conversationsCount = await r.parseCount(getConversationsJoinsAndWhereClause(
    // Only grab one field in order to minimize bandwidth
    r.knex.count('*'),
    organizationId,
    campaignsFilter,
    assignmentsFilter,
    contactsFilter,
    contactNameFilter
  ))

  const pageInfo = {
    limit: cursor.limit,
    offset: cursor.offset,
    total: conversationsCount
  }

  return {
    conversations,
    pageInfo
  }
}

export async function getCampaignIdMessageIdsAndCampaignIdContactIdsMaps(
  organizationId,
  campaignsFilter,
  assignmentsFilter,
  contactsFilter,
) {
  let query = r.knex.select(
    'campaign_contact.id as cc_id',
    'campaign.id as cmp_id',
    'message.id as mess_id',
  )

  query = getConversationsJoinsAndWhereClause(
    query,
    organizationId,
    campaignsFilter,
    assignmentsFilter,
    contactsFilter,
    contactNameFilter
  )

  query = query.leftJoin('message', table => {
    table
      .on('message.assignment_id', '=', 'assignment.id')
      .andOn('message.contact_number', '=', 'campaign_contact.cell')
  })

  query = query
    .orderBy('cc_id')

  const conversationRows = await query

  const campaignIdContactIdsMap = new Map()
  const campaignIdMessagesIdsMap = new Map()

  let ccId = undefined
  for (const conversationRow of conversationRows) {
    if (ccId !== conversationRow.cc_id) {
      const ccId = conversationRow.cc_id
      campaignIdContactIdsMap[conversationRow.cmp_id] = ccId

      if (!campaignIdContactIdsMap.has(conversationRow.cmp_id)) {
        campaignIdContactIdsMap.set(conversationRow.cmp_id, [])
      }

      campaignIdContactIdsMap.get(conversationRow.cmp_id).push(ccId)

      if (!campaignIdMessagesIdsMap.has(conversationRow.cmp_id)) {
        campaignIdMessagesIdsMap.set(conversationRow.cmp_id, [])
      }
    }

    if (conversationRow.mess_id) {
      campaignIdMessagesIdsMap.get(conversationRow.cmp_id).push(conversationRow.mess_id)
    }
  }

  return {
    campaignIdContactIdsMap,
    campaignIdMessagesIdsMap
  }
}

export async function getCampaignIdMessageIdsAndCampaignIdContactIdsMapsChunked(
  organizationId,
  campaignsFilter,
  assignmentsFilter,
  contactsFilter
) {
  let query = r.knex.select(
    'campaign_contact.id as cc_id',
    'campaign.id as cmp_id',
    'message.id as mess_id',
  )

  query = getConversationsJoinsAndWhereClause(
    query,
    organizationId,
    campaignsFilter,
    assignmentsFilter,
    contactsFilter,
    contactNameFilter
  )

  query = query.leftJoin('message', table => {
    table
      .on('message.assignment_id', '=', 'assignment.id')
      .andOn('message.contact_number', '=', 'campaign_contact.cell')
  })

  query = query
    .orderBy('cc_id')

  const conversationRows = await query
  const result = {}
  conversationRows.forEach(row => {
    result[row.cc_id] = {
      campaign_id: row.cmp_id,
      messages: []
    }
  })

  conversationRows.forEach(row => {
    if (row.mess_id) {
      result[row.cc_id].messages.push(row.mess_id)
    }
  })
  return Object.entries(result)
}


export async function reassignConversations(campaignIdContactIdsMap, campaignIdMessagesIdsMap, newTexterUserId) {
  // ensure existence of assignments
  const campaignIdAssignmentIdMap = new Map()
  for (const [campaignId, _] of campaignIdContactIdsMap) {
    let assignment = await r
      .table('assignment')
      .getAll(newTexterUserId, { index: 'user_id' })
      .filter({ campaign_id: campaignId })
      .limit(1)(0)
      .default(null)
    if (!assignment) {
      assignment = await Assignment.save({
        user_id: newTexterUserId,
        campaign_id: campaignId,
        max_contacts: parseInt(process.env.MAX_CONTACTS_PER_TEXTER || 0, 10)
      })
    }
    campaignIdAssignmentIdMap.set(campaignId, assignment.id)
  }

  // do the reassignment
  const returnCampaignIdAssignmentIds = []

  // TODO(larry) do this in a transaction!
  try {
    for (const [campaignId, campaignContactIds] of campaignIdContactIdsMap) {
      const assignmentId = campaignIdAssignmentIdMap.get(campaignId)

      await r
        .knex('campaign_contact')
        .where('campaign_id', campaignId)
        .whereIn('id', campaignContactIds)
        .update({
          assignment_id: assignmentId,
          updated_at: r.knex.fn.now()
        })

      returnCampaignIdAssignmentIds.push({
        campaignId,
        assignmentId: assignmentId.toString()
      })
    }
    for (const [campaignId, messageIds] of campaignIdMessagesIdsMap) {
      const assignmentId = campaignIdAssignmentIdMap.get(campaignId)

      await r
        .knex('message')
        .whereIn(
          'id',
          messageIds.map(messageId => {
            return messageId
          })
        )
        .update({
          assignment_id: assignmentId
        })
    }
  } catch (error) {
    log.error(error)
  }

  return returnCampaignIdAssignmentIds
}

export const resolvers = {
  PaginatedConversations: {
    conversations: queryResult => {
      return queryResult.conversations
    },
    pageInfo: queryResult => {
      if ('pageInfo' in queryResult) {
        return queryResult.pageInfo
      } else {
        return null
      }
    }
  },
  Conversation: {
    texter: queryResult => {
      return mapQueryFieldsToResolverFields(queryResult, {
        u_id: 'id',
        u_first_name: 'first_name',
        u_last_name: 'last_name'
      })
    },
    contact: queryResult => {
      return mapQueryFieldsToResolverFields(queryResult, {
        cc_id: 'id',
        cc_first_name: 'first_name',
        cc_last_name: 'last_name',
        opt_out_cell: 'opt_out_cell'
      })
    },
    campaign: queryResult => {
      return mapQueryFieldsToResolverFields(queryResult, { cmp_id: 'id' })
    }
  }
}
