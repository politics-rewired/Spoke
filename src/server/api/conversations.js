import _ from "lodash";

import { config } from "../../config";
import { UNASSIGNED_TEXTER } from "../../lib/constants";
import { eventBus, EventType } from "../event-bus";
import { r } from "../models";
import { addWhereClauseForContactsFilterMessageStatusIrrespectiveOfPastDue } from "./assignment";
import { buildCampaignQuery } from "./campaign";

async function getConversationsJoinsAndWhereClause(
  queryParam,
  organizationId,
  campaignsFilter,
  assignmentsFilter,
  tagsFilter,
  contactsFilter,
  contactNameFilter
) {
  let query = queryParam
    .from("campaign")
    .join("campaign_contact", "campaign.id", "campaign_contact.campaign_id")
    .leftJoin("assignment", "campaign_contact.assignment_id", "assignment.id")
    .leftJoin("user", "assignment.user_id", "user.id")
    .where({ "campaign.organization_id": organizationId });

  // Use a campaign id subquery instead of a filter on the campaign
  // Plays better with compound indexes
  query = query.whereIn(
    "campaign_contact.campaign_id",
    buildCampaignQuery(r.reader.select("id"), organizationId, campaignsFilter)
  );

  if (assignmentsFilter) {
    // Add the campaign id subquery to the assignment_id subquery
    // even though its duplicative of the join
    // Enables use of partial compound index

    if ("texterId" in assignmentsFilter) {
      // Searching for Unassigned
      if (assignmentsFilter.texterId === UNASSIGNED_TEXTER) {
        query = query.where({ "campaign_contact.assignment_id": null });
      }
      // Searching for specific texter
      else if (assignmentsFilter.texterId !== null) {
        query = query.whereIn(
          "campaign_contact.assignment_id",
          r
            .reader("assignment")
            .select("id")
            .whereIn(
              "assignment.campaign_id",
              buildCampaignQuery(
                r.reader.select("id"),
                organizationId,
                campaignsFilter
              )
            )
            .where({
              user_id: assignmentsFilter.texterId
            })
        );
      } else {
        // No-op: searching for all texters
      }
    }
  }

  if (contactNameFilter) {
    if (contactNameFilter.firstName)
      query = query.where(
        "campaign_contact.first_name",
        "ilike",
        `${contactNameFilter.firstName}%`
      );
    if (contactNameFilter.lastName)
      query = query.where(
        "campaign_contact.last_name",
        "ilike",
        `${contactNameFilter.lastName}%`
      );
    if (contactNameFilter.cellNumber)
      query = query.where({
        "campaign_contact.cell": contactNameFilter.cellNumber
      });
  }

  if (campaignsFilter) {
    if ("isArchived" in campaignsFilter) {
      query = query.whereRaw(
        `campaign_contact.archived = ${campaignsFilter.isArchived}`
      );
    }
  }

  query = addWhereClauseForContactsFilterMessageStatusIrrespectiveOfPastDue(
    query,
    contactsFilter && contactsFilter.messageStatus
  );

  if (contactsFilter && "isOptedOut" in contactsFilter) {
    const subQuery = r.reader
      .select("cell")
      .from("opt_out")
      .whereRaw("opt_out.cell=campaign_contact.cell");
    if (contactsFilter.isOptedOut) {
      query = query.whereExists(subQuery);
    } else {
      query = query.whereNotExists(subQuery);
    }
  }

  if (tagsFilter) {
    if (tagsFilter.escalatedConvosOnly) {
      query = query
        .join(
          "campaign_contact_tag",
          "campaign_contact_tag.campaign_contact_id",
          "=",
          "campaign_contact.id"
        )
        .join("tag", "tag.id", "=", "campaign_contact_tag.tag_id")
        .where({
          "tag.is_assignable": false,
          "tag.organization_id": organizationId
        });

      // query = query.whereExists(subQuery);
    } else if (tagsFilter.excludeEscalated) {
      query = query.whereNotExists(
        r.reader
          .select("campaign_contact_tag.campaign_contact_id")
          .from("campaign_contact_tag")
          .join("tag", "tag.id", "=", "campaign_contact_tag.tag_id")
          .where({
            "tag.is_assignable": false,
            "tag.organization_id": organizationId
          })
          .whereRaw(
            "campaign_contact_tag.campaign_contact_id = campaign_contact.id"
          )
      );
    }

    if (tagsFilter.specificTagIds && tagsFilter.specificTagIds.length > 0) {
      const specificTagIdsSubquery = r.reader
        .select("campaign_contact_tag.campaign_contact_id")
        .from("campaign_contact_tag")
        .join("tag", "tag.id", "=", "campaign_contact_tag.tag_id")
        .whereIn("tag.id", tagsFilter.specificTagIds);

      query = query.whereIn("campaign_contact.id", specificTagIdsSubquery);
    }
  }

  return { query };
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
    const newKey = fieldsMap[key];
    if (newKey) {
      return newKey;
    }
    return key;
  });
}

export async function getConversations(
  cursor,
  organizationId,
  campaignsFilter,
  assignmentsFilter,
  tagsFilter,
  contactsFilter,
  contactNameFilter
) {
  /* Query #1 == get campaign_contact.id for all the conversations matching
   * the criteria with offset and limit. */
  let offsetLimitQuery = r.reader.select("campaign_contact.id as cc_id");

  offsetLimitQuery = (
    await getConversationsJoinsAndWhereClause(
      offsetLimitQuery,
      organizationId,
      campaignsFilter,
      assignmentsFilter,
      tagsFilter,
      contactsFilter,
      contactNameFilter
    )
  ).query;

  offsetLimitQuery = offsetLimitQuery.leftJoin(
    r.reader.raw(
      "message on message.id = ( select id from message where campaign_contact_id = campaign_contact.id order by created_at desc limit 1 )"
    )
  );

  offsetLimitQuery = offsetLimitQuery
    .orderByRaw("message.created_at desc nulls last")
    .orderByRaw("campaign_contact.updated_at desc nulls last")
    .orderBy("cc_id");

  offsetLimitQuery = offsetLimitQuery.limit(cursor.limit).offset(cursor.offset);

  const ccIdRows = await offsetLimitQuery;
  const ccIds = ccIdRows.map((ccIdRow) => {
    return ccIdRow.cc_id;
  });

  /* Query #2 -- get all the columns we need, including messages, using the
   * cc_ids from Query #1 to scope the results to limit, offset */
  let query = r.reader.select(
    "campaign_contact.id as cc_id",
    "campaign_contact.first_name as cc_first_name",
    "campaign_contact.last_name as cc_last_name",
    "campaign_contact.cell",
    "campaign_contact.message_status",
    "campaign_contact.is_opted_out",
    "campaign_contact.updated_at",
    "campaign_contact.assignment_id",
    "opt_out.cell as opt_out_cell",
    "user.id as u_id",
    "user.first_name as u_first_name",
    "user.last_name as u_last_name",
    "campaign.id as cmp_id",
    "campaign.title",
    "campaign.due_by",
    "assignment.id as ass_id",
    "message.id as mess_id",
    "message.text",
    "message.user_number",
    "message.contact_number",
    "message.created_at",
    "message.is_from_contact",
    "message.created_at",
    "message.send_status",
    "message.user_id"
  );

  query = (
    await getConversationsJoinsAndWhereClause(
      query,
      organizationId,
      campaignsFilter,
      assignmentsFilter,
      tagsFilter,
      contactsFilter,
      contactNameFilter
    )
  ).query;

  query = query.whereIn("campaign_contact.id", ccIds);

  query = query.leftJoin(
    "message",
    "message.campaign_contact_id",
    "=",
    "campaign_contact.id"
  );

  // Sorting has already happened in Query 1 and will happen in the JS grouping below
  query = query.leftJoin("opt_out", (table) => {
    table
      .on("opt_out.organization_id", "=", "campaign.organization_id")
      .andOn("campaign_contact.cell", "opt_out.cell");
  });

  const conversationRows = await query;

  /* collapse the rows to produce an array of objects, with each object
   * containing the fields for one conversation, each having an array of
   * message objects */
  const messageFields = [
    "mess_id",
    "text",
    "user_number",
    "contact_number",
    "created_at",
    "is_from_contact",
    "user_id",
    "send_status"
  ];

  const groupedContacts = _.groupBy(conversationRows, "cc_id");
  const conversations = Object.keys(groupedContacts)
    .map((contactId) => {
      const contactMessages = groupedContacts[contactId];
      const firstRow = contactMessages[0];

      const conversation = _.omit(firstRow, messageFields);

      if (firstRow.created_at) {
        conversation.updated_at = firstRow.created_at;
      }

      conversation.messages = contactMessages
        .filter((messageRow) => messageRow.mess_id !== null)
        // Sort ASC to display most recent _messages_ last
        .sort((messageA, messageB) => messageA.created_at - messageB.created_at)
        .map((message) => {
          return mapQueryFieldsToResolverFields(
            _.pick(message, messageFields),
            { mess_id: "id" }
          );
        });
      return conversation;
    })
    // Sort DESC to display most recent _conversations_ first
    .sort((convA, convB) => convB.updated_at - convA.updated_at);

  /* Query #3 -- get the count of all conversations matching the criteria.
   * We need this to show total number of conversations to support paging */
  const conversationsCount = await r.parseCount(
    (
      await getConversationsJoinsAndWhereClause(
        // Only grab one field in order to minimize bandwidth
        r.reader.count("*"),
        organizationId,
        campaignsFilter,
        assignmentsFilter,
        tagsFilter,
        contactsFilter,
        contactNameFilter
      )
    ).query
  );

  const pageInfo = {
    limit: cursor.limit,
    offset: cursor.offset,
    total: conversationsCount
  };

  return {
    conversations,
    pageInfo
  };
}

export async function getCampaignIdMessageIdsAndCampaignIdContactIdsMaps(
  organizationId,
  campaignsFilter,
  assignmentsFilter,
  tagsFilter,
  contactsFilter,
  contactNameFilter
) {
  let query = r.reader.select(
    "campaign_contact.id as cc_id",
    "campaign.id as cmp_id",
    "message.id as mess_id"
  );

  query = (
    await getConversationsJoinsAndWhereClause(
      query,
      organizationId,
      campaignsFilter,
      assignmentsFilter,
      tagsFilter,
      contactsFilter,
      contactNameFilter
    )
  ).query;

  query = query.leftJoin("message", (table) => {
    table.on("message.campaign_contact_id", "=", "campaign_contact.id");
  });

  query = query.orderBy("cc_id");

  const conversationRows = await query;

  const campaignIdContactIdsMap = new Map();
  const campaignIdMessagesIdsMap = new Map();

  let ccId;
  for (const conversationRow of conversationRows) {
    if (ccId !== conversationRow.cc_id) {
      ccId = conversationRow.cc_id;
      campaignIdContactIdsMap[conversationRow.cmp_id] = ccId;

      if (!campaignIdContactIdsMap.has(conversationRow.cmp_id)) {
        campaignIdContactIdsMap.set(conversationRow.cmp_id, []);
      }

      campaignIdContactIdsMap.get(conversationRow.cmp_id).push(ccId);

      if (!campaignIdMessagesIdsMap.has(conversationRow.cmp_id)) {
        campaignIdMessagesIdsMap.set(conversationRow.cmp_id, []);
      }
    }

    if (conversationRow.mess_id) {
      campaignIdMessagesIdsMap
        .get(conversationRow.cmp_id)
        .push(conversationRow.mess_id);
    }
  }

  return {
    campaignIdContactIdsMap,
    campaignIdMessagesIdsMap
  };
}

export async function getCampaignIdMessageIdsAndCampaignIdContactIdsMapsChunked(
  organizationId,
  campaignsFilter,
  assignmentsFilter,
  tagsFilter,
  contactsFilter,
  contactNameFilter
) {
  let query = r.reader.select(
    "campaign_contact.id as cc_id",
    "campaign.id as cmp_id",
    "message.id as mess_id"
  );

  query = (
    await getConversationsJoinsAndWhereClause(
      query,
      organizationId,
      campaignsFilter,
      assignmentsFilter,
      tagsFilter,
      contactsFilter,
      contactNameFilter
    )
  ).query;

  query = query.leftJoin("message", (table) => {
    table
      .on("message.assignment_id", "=", "assignment.id")
      .andOn("message.contact_number", "=", "campaign_contact.cell");
  });

  query = query.orderBy("cc_id");

  const conversationRows = await query;
  const result = {};
  conversationRows.forEach((row) => {
    result[row.cc_id] = {
      campaign_id: row.cmp_id,
      messages: []
    };
  });

  conversationRows.forEach((row) => {
    if (row.mess_id) {
      result[row.cc_id].messages.push(row.mess_id);
    }
  });
  return Object.entries(result);
}

export const reassignContacts = async (campaignContactIds, newTexterId) => {
  const result = await r.knex.transaction(async (trx) => {
    // Fetch more complete information for campaign contacts
    const campaignContacts = await trx("campaign_contact")
      .select(["id", "campaign_id"])
      .whereIn("id", campaignContactIds);

    // Batch update by campaign
    const contactsByCampaignId = _.groupBy(campaignContacts, "campaign_id");
    const campaignIds = Object.keys(contactsByCampaignId);
    await Promise.all(
      campaignIds.map(async (campaignId) => {
        // See if newTexter already has an assignment for this campaign
        const existingAssignment = await trx("assignment")
          .where({
            campaign_id: campaignId,
            user_id: newTexterId
          })
          .first("id");
        let assignmentId = existingAssignment && existingAssignment.id;
        if (!assignmentId) {
          // Create a new assignment if none exists
          const [newAssignment] = await trx("assignment")
            .insert({
              campaign_id: campaignId,
              user_id: newTexterId
            })
            .returning("*");
          eventBus.emit(EventType.AssignmentCreated, newAssignment);
          assignmentId = newAssignment.id;
        }

        // Update the contact's assignment
        const contactIds = contactsByCampaignId[campaignId].map(
          (contact) => contact.id
        );
        await trx("campaign_contact")
          .update({
            assignment_id: assignmentId
          })
          .whereIn("id", contactIds);

        // Update the conversations messages
        await trx("message")
          .update({ assignment_id: assignmentId })
          .whereIn("campaign_contact_id", contactIds);
      })
    );
    return campaignContactIds;
  });

  return result;
};

export async function reassignConversations(
  campaignIdContactIdsMap,
  campaignIdMessagesIdsMap,
  newTexterUserId
) {
  // ensure existence of assignments
  const campaignIdAssignmentIdMap = new Map();
  for (const [campaignId, _ignore] of campaignIdContactIdsMap) {
    let assignment = await r
      .knex("assignment")
      .where({
        user_id: newTexterUserId,
        campaign_id: campaignId
      })
      .first();
    if (!assignment) {
      const [newAssignment] = await r
        .knex("assignment")
        .insert({
          user_id: newTexterUserId,
          campaign_id: campaignId,
          max_contacts: config.MAX_CONTACTS_PER_TEXTER
        })
        .returning("*");
      eventBus.emit(EventType.AssignmentCreated, newAssignment);
      assignment = newAssignment;
    }
    campaignIdAssignmentIdMap.set(campaignId, assignment.id);
  }

  const returnCampaignIdAssignmentIds = await r.knex.transaction(
    async (trx) => {
      const result = [];

      for (const [campaignId, campaignContactIds] of campaignIdContactIdsMap) {
        const assignmentId = campaignIdAssignmentIdMap.get(campaignId);
        await trx("campaign_contact")
          .where("campaign_id", campaignId)
          .whereIn("id", campaignContactIds)
          .update({
            assignment_id: assignmentId
          });

        result.push({
          campaignId,
          assignmentId: assignmentId.toString()
        });
      }

      for (const [campaignId, messageIds] of campaignIdMessagesIdsMap) {
        const assignmentId = campaignIdAssignmentIdMap.get(campaignId);
        await trx("message").whereIn("id", messageIds).update({
          assignment_id: assignmentId
        });
      }

      return result;
    }
  );

  return returnCampaignIdAssignmentIds;
}

export const resolvers = {
  PaginatedConversations: {
    conversations: (queryResult) => {
      return queryResult.conversations;
    },
    pageInfo: (queryResult) => {
      if ("pageInfo" in queryResult) {
        return queryResult.pageInfo;
      }
      return null;
    }
  },
  Conversation: {
    texter: (queryResult) => {
      return mapQueryFieldsToResolverFields(queryResult, {
        u_id: "id",
        u_first_name: "first_name",
        u_last_name: "last_name"
      });
    },
    contact: (queryResult) => {
      return mapQueryFieldsToResolverFields(queryResult, {
        cc_id: "id",
        cc_first_name: "first_name",
        cc_last_name: "last_name",
        opt_out_cell: "opt_out_cell"
      });
    },
    campaign: (queryResult) => {
      return mapQueryFieldsToResolverFields(queryResult, { cmp_id: "id" });
    }
  }
};
