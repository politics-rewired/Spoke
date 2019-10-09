import { r } from "../../models";
import { config } from "../../../config";

/**
 * Assign an appropriate messaging service for a (cell, organization) pairing.
 * This creates a messaging_service_stick record.
 * @param {string} cell An E164-formatted destination cell phone number
 * @param {number} organizationId The ID of the organization to create the mapping for
 * @returns {string} The (S)ID of the messaging service assigned to that (cell, organization)
 */
export const assignMessagingServiceSID = async (cell, organizationId) => {
  const {
    rows: [{ messaging_service_sid }]
  } = await r.knex.raw(
    `
      with chosen_messaging_service_sid as (
        select
          messaging_service.messaging_service_sid,
          count(messaging_service_stick.messaging_service_sid) as count
        from messaging_service
        left join messaging_service_stick
          on messaging_service_stick.messaging_service_sid = messaging_service.messaging_service_sid
        where messaging_service.organization_id = ?
        group by
          messaging_service.messaging_service_sid
        order by count asc
        limit 1
      )
      insert into messaging_service_stick (cell, organization_id, messaging_service_sid)
      values (?, ?, (select messaging_service_sid from chosen_messaging_service_sid))
      returning messaging_service_sid;
    `,
    [organizationId, cell, organizationId]
  );

  return messaging_service_sid;
};

/**
 * Fetches an existing assigned messaging service for a campaign contact. If no messaging service
 * has been assigned then assign one and return that.
 * @param {number} campaignContactId The ID of the target campaign contact
 * @returns {object} Assigned messaging service Postgres row
 */
export const getMessagingService = async campaignContactId => {
  if (config.DEFAULT_SERVICE === "fakeservice")
    return { service: "fakeservice" };

  const campaignContact = await r
    .knex("campaign_contact")
    .join("campaign", "campaign.id", "campaign_contact.campaign_id")
    .where({ "campaign_contact.id": campaignContactId })
    .first(["campaign_contact.cell", "campaign.organization_id"]);

  if (!campaignContact)
    throw new Error(`Unknown campaign contact ID ${campaignContactId}`);

  const { organization_id, cell } = campaignContact;

  const {
    rows: [existingMessagingService]
  } = await r.knex.raw(
    `
      select messaging_service.*
      from messaging_service
      join messaging_service_stick
        on messaging_service_stick.messaging_service_sid = messaging_service.messaging_service_sid
      where
        messaging_service_stick.organization_id = ?
        and messaging_service_stick.cell = ?
      ;
    `,
    [organization_id, cell]
  );

  // Return an existing match if there is one
  if (existingMessagingService) return existingMessagingService;

  // Otherwise select an appropriate messaging service and assign
  const serviceSid = await assignMessagingServiceSID(cell, organization_id);
  const messagingService = await r
    .knex("messaging_service")
    .where({ messaging_service_sid: serviceSid })
    .first();
  return messagingService;
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
  - both query options were pretty good – the campaign_contact.cell and message.campaign_contact_id
      index filters are fast enough and the result set to filter through small enough that the rest doesn't
      really matter
    - first one was much easier to plan, so going with that one
 */

export async function getCampaignContactAndAssignmentForIncomingMessage({
  contactNumber,
  service,
  messaging_service_sid
}) {
  const { rows } = await r.knex.raw(
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
    [messaging_service_sid, contactNumber]
  );

  return rows[0];
}

export async function saveNewIncomingMessage(messageInstance) {
  await r
    .knex("message")
    .insert(messageInstance)
    .returning("*");

  // Separate update fields according to: https://stackoverflow.com/a/42307979
  let updateQuery = r
    .knex("campaign_contact")
    .update({ message_status: "needsResponse" })
    .limit(1);

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
  } catch (error) {}

  // service_response should be an array of responses (although this is usually of length 1)
  if (!Array.isArray(existingResponses)) {
    existingResponses = [existingResponses];
  }

  existingResponses.push(newResponse);
  return JSON.stringify(existingResponses);
};
