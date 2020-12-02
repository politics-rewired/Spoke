import { r } from "../../models";
// eslint-disable-next-line import/named
import { getLastMessage } from "./message-sending";

// This 'fakeservice' allows for fake-sending messages
// that end up just in the db appropriately and then using sendReply() graphql
// queries for the reception (rather than a real service)

async function sendMessage(message, _organizationId, _trx) {
  return r
    .knex("message")
    .update({
      send_status: "SENT",
      service: "fakeservice",
      sent_at: r.knex.fn.now()
    })
    .where({ id: message.id });
}

// None of the rest of this is even used for fake-service
// but *would* be used if it was actually an outside service.

async function convertMessagePartsToMessage(messageParts) {
  const firstPart = messageParts[0];
  const userNumber = firstPart.user_number;
  const contactNumber = firstPart.contact_number;
  const text = firstPart.service_message;

  const lastMessage = await getLastMessage({
    service: "fakeservice",
    contactNumber
  });

  const service_id =
    firstPart.service_id ||
    `fakeservice_${Math.random()
      .toString(36)
      .replace(/[^a-zA-Z1-9]+/g, "")}`;

  return {
    contact_number: contactNumber,
    user_number: userNumber,
    is_from_contact: true,
    text,
    service_response: JSON.stringify(messageParts),
    service_id,
    assignment_id: lastMessage.assignment_id,
    service: "fakeservice",
    send_status: "DELIVERED"
  };
}

async function handleIncomingMessage(message) {
  const { contact_number, user_number, service_id, text } = message;
  const [partId] = await r
    .knex("pending_message_part")
    .insert({
      service: "fakeservice",
      service_id,
      parent_id: null,
      service_message: text,
      user_number,
      contact_number
    })
    .returning("id");
  return partId;
}

export default {
  sendMessage,
  // useless unused stubs
  convertMessagePartsToMessage,
  handleIncomingMessage
};
