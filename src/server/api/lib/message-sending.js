import { r } from "../../models";

export async function getLastMessage({ contactNumber, service }) {
  const lastMessage = await r
    .knex("message")
    .where({
      contact_number: contactNumber,
      is_from_contact: false,
      service
    })
    .orderBy("created_at", "desc")
    .limit(1)
    .first("assignment_id", "campaign_contact_id");

  return lastMessage;
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
