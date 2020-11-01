import Nexmo from "nexmo";

import { config } from "../../../config";
import { getFormattedPhoneNumber } from "../../../lib/phone-format";
import logger from "../../../logger";
import { r } from "../../models";
import { appendServiceResponse, getLastMessage } from "./message-sending";

let nexmo = null;
const MAX_SEND_ATTEMPTS = 5;
if (config.NEXMO_API_KEY && config.NEXMO_API_SECRET) {
  nexmo = new Nexmo({
    apiKey: config.NEXMO_API_KEY,
    apiSecret: config.NEXMO_API_SECRET
  });
}

async function convertMessagePartsToMessage(messageParts) {
  const firstPart = messageParts[0];
  const userNumber = firstPart.user_number;
  const contactNumber = firstPart.contact_number;
  const serviceMessages = messageParts.map(part =>
    JSON.parse(part.service_message)
  );
  const text = serviceMessages
    .map(serviceMessage => serviceMessage.text)
    .join("");

  const lastMessage = await getLastMessage({
    service: "nexmo",
    contactNumber
  });

  return {
    contact_number: contactNumber,
    user_number: userNumber,
    is_from_contact: true,
    text,
    service_response: JSON.stringify(serviceMessages),
    service_id: serviceMessages[0].service_id,
    assignment_id: lastMessage.assignment_id,
    service: "nexmo",
    send_status: "DELIVERED"
  };
}

async function findNewCell() {
  return new Promise((resolve, reject) => {
    nexmo.number.search(
      "US",
      { features: "VOICE,SMS", size: 1 },
      (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      }
    );
  });
}

async function rentNewCell() {
  const newCell = await findNewCell();

  if (
    newCell &&
    newCell.numbers &&
    newCell.numbers[0] &&
    newCell.numbers[0].msisdn
  ) {
    return new Promise((resolve, reject) => {
      nexmo.number.buy("US", newCell.numbers[0].msisdn, (err, response) => {
        if (err) {
          reject(err);
        } else {
          // It appears we need to check error-code in the response even if response is returned.
          // This library returns responses that look like { error-code: 401, error-label: 'not authenticated'}
          // or the bizarrely-named { error-code: 200 } even in the case of success
          if (response["error-code"] !== "200") {
            reject(new Error(response["error-code-label"]));
          } else {
            resolve(newCell.numbers[0].msisdn);
          }
        }
      });
    });
  }
  throw new Error("Did not find any cell");
}

async function sendMessage(message, trx = r.knex) {
  if (!nexmo) {
    await trx("message")
      .update({ send_status: "SENT" })
      .where({ id: message.id });
    return "test_message_uuid";
  }

  return new Promise((resolve, reject) => {
    // US numbers require that the + be removed when sending via nexmo
    nexmo.message.sendSms(
      message.user_number.replace(/^\+/, ""),
      message.contact_number,
      message.text,
      {
        "status-report-req": 1,
        "client-ref": message.id
      },
      (err, response) => {
        const messageToSave = {
          ...message
        };
        let hasError = false;
        if (err) {
          hasError = true;
        }
        if (response) {
          response.messages.forEach(serviceMessages => {
            if (serviceMessages.status !== "0") {
              hasError = true;
            }
          });
          messageToSave.service_response = appendServiceResponse(
            messageToSave.service_response,
            response
          );
        }

        messageToSave.service = "nexmo";

        if (hasError) {
          if (messageToSave.service_messages.length >= MAX_SEND_ATTEMPTS) {
            messageToSave.send_status = "ERROR";
          }
          const { id: messageId, ...messagePayload } = message;
          trx("message")
            .update(messagePayload)
            .where({ id: messageId })
            .then(() =>
              reject(
                err ||
                  (response
                    ? new Error(JSON.stringify(response))
                    : new Error("Encountered unknown error"))
              )
            );
        } else {
          const { id: messageId, ...messagePayload } = message;
          trx("message")
            .update({ ...messagePayload, send_status: "SENT" })
            .where({ id: messageId })
            .returning("*")
            .then(([newMessage]) => resolve(newMessage));
        }
      }
    );
  });
}

async function handleDeliveryReport(report) {
  if (report.hasOwnProperty("client-ref")) {
    const message = await r
      .knex("message")
      .where({ id: report["client-ref"] })
      .first();
    message.service_response = appendServiceResponse(
      message.service_response,
      report
    );
    if (report.status === "delivered" || report.status === "accepted") {
      message.send_status = "DELIVERED";
    } else if (
      report.status === "expired" ||
      report.status === "failed" ||
      report.status === "rejected"
    ) {
      message.send_status = "ERROR";
    }
    const { id: messageId, ...messagePayload } = message;
    await r
      .knex("message")
      .update(messagePayload)
      .where({ id: messageId });
  }
}

async function handleIncomingMessage(message) {
  if (
    !message.hasOwnProperty("to") ||
    !message.hasOwnProperty("msisdn") ||
    !message.hasOwnProperty("text") ||
    !message.hasOwnProperty("messageId")
  ) {
    logger.error("This is not an incoming message", { payload: message });
  }

  const { to, msisdn, concat } = message;
  const isConcat = concat === "true";
  const contactNumber = getFormattedPhoneNumber(msisdn);
  const userNumber = getFormattedPhoneNumber(to);

  let parentId = "";
  if (isConcat) {
    logger.info(
      `Incoming message part (${message["concat-part"]} of ${
        message["concat-total"]
      } for ref ${
        message["concat-ref"]
      }) from ${contactNumber} to ${userNumber}`
    );
    parentId = message["concat-ref"];
  } else {
    logger.info(`Incoming message part from ${contactNumber} to ${userNumber}`);
  }

  const [partId] = await r
    .knex("pending_message_part")
    .insert({
      service: "nexmo",
      service_id: message["concat-ref"] || message.messageId,
      parent_id: parentId, // do we need this anymore, now we have service_id?
      service_message: JSON.stringify(message),
      user_number: userNumber,
      contact_number: contactNumber
    })
    .returning("id");

  return partId;
}

export default {
  convertMessagePartsToMessage,
  findNewCell,
  rentNewCell,
  sendMessage,
  handleDeliveryReport,
  handleIncomingMessage
};
