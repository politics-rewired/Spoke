import { r } from "../../models";

/*
  This needs to change to accomodate multiple organizationIds
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
    .update("updated_at", r.knex.fn.now())
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
