import groupBy from "lodash/groupBy";

import { config } from "../../../config";
import { eventBus, EventType } from "../../event-bus";
import { queueExternalSyncForAction } from "../../lib/external-systems";
import { cacheableData, r } from "../../models";
import { ActionType } from "../types";

export const SpokeSendStatus = Object.freeze({
  Queued: "QUEUED",
  Sending: "SENDING",
  Sent: "SENT",
  Delivered: "DELIVERED",
  Error: "ERROR",
  Paused: "PAUSED",
  NotAttempted: "NOT_ATTEMPTED"
});

const OPT_OUT_TRIGGERS = [
  "stop",
  "stop all",
  "stopall",
  "unsub",
  "unsubscribe",
  "cancel",
  "end",
  "quit",
  "stop2quit",
  "stop 2 quit",
  "stop=quit",
  "stop = quit",
  "stop to quit",
  "stoptoquit"
];

/**
 * Return a list of messaing services for an organization that are candidates for assignment.
 *
 * TODO: Update logic to allow for per-campaign decisions.
 *
 * @param {number} organizationId The ID of organization
 */
export const getMessagingServiceCandidates = async (
  organizationId,
  serviceType
) => {
  const { rows: messagingServiceCandidates } = await r.reader.raw(
    `
      select
        messaging_service.messaging_service_sid
      from messaging_service
      where messaging_service.service_type = ?
        and messaging_service.organization_id = ?
    `,
    [serviceType, organizationId]
  );
  return messagingServiceCandidates;
};

/**
 * Assign an appropriate messaging service for a (cell, organization) pairing.
 * This creates a messaging_service_stick record.
 *
 * TODO: Update logic to allow for per-campaign decisions.
 *
 * @param {string} cell An E164-formatted destination cell phone number
 * @param {number} organizationId The ID of the organization to create the mapping for
 * @returns {object} The messaging service record assigned to that (cell, organization)
 */
export const assignMessagingServiceSID = async (cell, organizationId) => {
  const {
    rows: [messaging_service]
  } = await r.knex.raw(
    `
      with service_type_selection as (
        select
          cell,
          get_messaging_service_type(max(zip)) as service_type
        from campaign_contact
        where cell = ?
        group by cell
      ),
      chosen_messaging_service_sid as (
        select
          messaging_service.messaging_service_sid
        from messaging_service
        where messaging_service.organization_id = ?
          and messaging_service.service_type = ( select service_type from service_type_selection )
        group by
          messaging_service.messaging_service_sid
        order by random()
        limit 1
      ),
      insert_results as (
        insert into messaging_service_stick (cell, organization_id, messaging_service_sid)
        values (?, ?, (select messaging_service_sid from chosen_messaging_service_sid))
        returning messaging_service_sid
      )
      select * from messaging_service, insert_results
      where messaging_service.messaging_service_sid = insert_results.messaging_service_sid
      limit 1;
    `,
    [cell, organizationId, cell, organizationId]
  );

  return messaging_service;
};

/**
 * Fetch messaging service by its ID
 * @param {string} messagingServiceId The messaging service ID
 * @returns {object} The messaging service record if found, or undefined;
 */
export const getMessagingServiceById = async (messagingServiceId) =>
  r
    .reader("messaging_service")
    .where({ messaging_service_sid: messagingServiceId })
    .first();

/**
 * Fetches an existing assigned messaging service for a campaign contact. If no messaging service
 * has been assigned then assign one and return that.
 * @param {number} campaignContactId The ID of the target campaign contact
 * @returns {object} Assigned messaging service Postgres row
 */
export const getContactMessagingService = async (
  campaignContactId,
  organizationId
) => {
  if (config.DEFAULT_SERVICE === "fakeservice")
    return { service_type: "fakeservice" };

  const campaignData = await r
    .reader("campaign")
    .join(
      "campaign_contact",
      "campaign.id",
      "=",
      "campaign_contact.campaign_id"
    )
    .where({ "campaign_contact.id": campaignContactId })
    .first();

  if (campaignData.messaging_service_sid) {
    return getMessagingServiceById(campaignData.messaging_service_sid);
  }

  const {
    rows: [existingMessagingService]
  } = await r.reader.raw(
    `
      select *
      from get_messaging_service_for_campaign_contact_in_organization(?, ?)
    `,
    [campaignContactId, parseInt(organizationId, 10)]
  );

  // Return an existing match if there is one - this is the vast majority of cases
  if (
    existingMessagingService &&
    existingMessagingService.messaging_service_sid
  ) {
    return existingMessagingService;
  }

  const campaignContact = await r
    .reader("campaign_contact")
    .where({ id: campaignContactId })
    .first("cell");

  // Otherwise select an appropriate messaging service and assign
  const assignedService = await assignMessagingServiceSID(
    campaignContact.cell,
    parseInt(organizationId, 10)
  );

  return assignedService;
};

/**
 * Make best effort attempt to assign messaging services to all campaign contacts in a campaign
 * for which there is not an existing messaging service assignment for that contacts cell. This
 * will do nothing if DEFAULT_SERVICE is `fakeservice` or the organization has no messaging
 * services.
 *
 * NOTE: This does not chunk inserts so make sure this is run only when you are sure the specified
 * campaign has a reasonable size (< 1000) of cells without sticky messaging services.
 *
 * @param {object} trx Knex client
 * @param {number} campaignId
 * @param {number} organizationId
 */
export const assignMissingMessagingServices = async (
  trx,
  campaignId,
  organizationId
) => {
  // Do not attempt assignment if we're using fakeservice
  if (config.DEFAULT_SERVICE === "fakeservice") return;

  const { rows } = await trx.raw(
    `
      select
        distinct campaign_contact.cell,
        get_messaging_service_type(campaign_contact.zip) as service_type
      from
        messaging_service_stick
        join messaging_service
          on messaging_service.messaging_service_sid = messaging_service_stick.messaging_service_sid
        right join campaign_contact
          on messaging_service_stick.cell = campaign_contact.cell
          and messaging_service_stick.organization_id = ?
      where
        campaign_contact.campaign_id = ?
        and messaging_service_stick.messaging_service_sid is null
    `,
    [organizationId, campaignId]
  );

  if (rows.length === 0) return;

  const cellsByServiceType = groupBy(rows, (row) => row.service_type);
  const messagingServiceCandidatesByServiceType = {};

  for (const serviceType of Object.keys(cellsByServiceType)) {
    messagingServiceCandidatesByServiceType[
      serviceType
    ] = await getMessagingServiceCandidates(organizationId, serviceType);

    // Do not attempt assignment if there are no messaging service candidates
    if (messagingServiceCandidatesByServiceType[serviceType].length === 0)
      return;
  }

  const toInsertByType = {};

  for (const serviceType of Object.keys(cellsByServiceType)) {
    const candidates = messagingServiceCandidatesByServiceType[serviceType];

    toInsertByType[serviceType] = cellsByServiceType[serviceType].map(
      (row, idx) => ({
        cell: row.cell,

        organization_id: organizationId,
        messaging_service_sid:
          candidates[idx % candidates.length].messaging_service_sid
      })
    );
  }

  let allToInsert = [];
  for (const serviceType of Object.keys(toInsertByType)) {
    allToInsert = allToInsert.concat(toInsertByType[serviceType]);
  }

  return trx("messaging_service_stick").insert(allToInsert);
};

const mediaExtractor = /\[\s*(http[^\]\s]*)\s*\]/;

/**
 * Extract Spoke-style media attachments from the plain message text.
 * @param {string} messageText The raw Spoke message text.
 * @returns {object} Object with properties `body` (required) and `mediaUrl` (optional).
 *     `body` is the input text stripped of media markdown.
 *     `mediaUrl` is the extracted media URL, if present.
 */
export const messageComponents = (messageText) => {
  const params = {
    body: messageText.replace(mediaExtractor, "")
  };

  // Image extraction
  const results = messageText.match(mediaExtractor);
  if (results) {
    // eslint-disable-next-line prefer-destructuring
    params.mediaUrl = results[1];
  }

  return params;
};

/*
  This was changed to accommodate multiple organizationIds. There were two potential approaches:
  - option one: with campaign_id_options as select campaigns from organizationId, where campaign_id = campaign.id
    -----------------------------------
    with chosen_organization as (
      select organization_id
      from messaging_service
      where messaging_service_sid = ?
    )
    with campaign_contact_option as (
      select id
      from campaign_contact
      join campaign
        on campaign_contact.campaign_id = campaign.id
      where
        campaign.organization_id in (
          select id from chosen_organization
        )
        and campaign_contact.cell = ?
    )
    select campaign_contact_id, assignment_id
    from message
    join campaign_contact_option
      on message.campaign_contact_id = campaign_contact_option.id
    where
      message.is_from_contact = false
    order by created_at desc
    limit 1
    -----------------------------------

  - option two: join campaign_contact, join campaign, where campaign.org_id = org_id
    -----------------------------------
    select campaign_contact_id, assignment_id
    from message
    join campaign_contact
      on message.campaign_contact_id = campaign_contact.id
    join campaign
      on campaign.id = campaign_contact.campaign_id
    where
      campaign.organization_id = ?
      and campaign_contact.cell = ?
      and message.is_from_contact = false
    order by created_at desc
    limit 1
    -----------------------------------

  - must do explain analyze
  - both query options were pretty good – the campaign_contact.cell and message.campaign_contact_id
      index filters are fast enough and the result set to filter through small enough that the rest doesn't
      really matter
    - first one was much easier to plan, so going with that one
 */

export async function getCampaignContactAndAssignmentForIncomingMessage({
  contactNumber,
  _service,
  messaging_service_sid
}) {
  const { rows } = await r.reader.raw(
    `
    with chosen_organization as (
      select organization_id
      from messaging_service
      where messaging_service_sid = ?
    ),
    campaign_contact_option as (
      select campaign_contact.id
      from campaign_contact
      join campaign
        on campaign_contact.campaign_id = campaign.id
      where
        campaign.organization_id in (
          select organization_id from chosen_organization
        )
        and (
          campaign.messaging_service_sid IS NULL
          or campaign.messaging_service_sid = ?
        )
        and campaign_contact.cell = ?
    )
    select campaign_contact_id, assignment_id
    from message
    join campaign_contact_option
      on message.campaign_contact_id = campaign_contact_option.id
    where
      message.is_from_contact = false
    order by created_at desc
    limit 1`,
    [messaging_service_sid, messaging_service_sid, contactNumber]
  );

  return rows[0];
}

export async function saveNewIncomingMessage(messageInstance) {
  const [newMessage] = await r
    .knex("message")
    .insert(messageInstance)
    .returning("*");
  const { text, assignment_id, contact_number } = newMessage;
  const payload = {
    assignmentId: assignment_id,
    contactNumber: contact_number
  };
  eventBus.emit(EventType.MessageReceived, payload);

  const cleanedUpText = text.toLowerCase().trim();

  // Separate update fields according to: https://stackoverflow.com/a/42307979
  let updateQuery = r.knex("campaign_contact").limit(1);

  if (OPT_OUT_TRIGGERS.includes(cleanedUpText)) {
    const { id: organizationId } = await r
      .knex("organization")
      .first("organization.id")
      .join("campaign", "organization_id", "=", "organization.id")
      .join("assignment", "campaign_id", "=", "campaign.id")
      .where({ "assignment.id": assignment_id });

    const existingOptOutQuery = r
      .knex("opt_out")
      .first("id")
      .where({ cell: contact_number });

    const existingOptOut = await existingOptOutQuery;

    if (existingOptOut === undefined) {
      updateQuery = updateQuery.update({ message_status: "closed" });

      const optOutId = await cacheableData.optOut.save(r.knex, {
        cell: contact_number,
        reason: "Automatic OptOut",
        assignmentId: assignment_id,
        organizationId
      });

      await queueExternalSyncForAction(ActionType.OptOut, optOutId);
    }
  } else {
    updateQuery = updateQuery.update({ message_status: "needsResponse" });
  }

  // Prefer to match on campaign contact ID
  if (messageInstance.campaign_contact_id) {
    updateQuery = updateQuery.where({
      id: messageInstance.campaign_contact_id
    });
  } else {
    updateQuery = updateQuery.where({
      assignment_id: messageInstance.assignment_id,
      cell: messageInstance.contact_number
    });
  }

  await updateQuery;
}

/**
 * Safely append a new service response to an existing service_response value.
 * The existing value should be a stringified array but may not be so handle those cases.
 * @param {string} responsesString stringified array of service responses
 * @param {object} newResponse a new service response object to append
 */
export const appendServiceResponse = (responsesString, newResponse) => {
  responsesString = responsesString !== undefined ? responsesString : "[]";

  // Account for service responses stored incorrectly prior to fix
  if (responsesString.indexOf("undefined") === 0) {
    responsesString = responsesString.slice(9);
  }

  let existingResponses = [];
  try {
    existingResponses = JSON.parse(responsesString);
  } catch (error) {
    // stub
  }

  // service_response should be an array of responses (although this is usually of length 1)
  if (!Array.isArray(existingResponses)) {
    existingResponses = [existingResponses];
  }

  existingResponses.push(newResponse);
  return JSON.stringify(existingResponses);
};
