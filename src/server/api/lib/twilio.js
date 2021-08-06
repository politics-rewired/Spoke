import _ from "lodash";
import Twilio from "twilio";

import { config } from "../../../config";
import { DateTime } from "../../../lib/datetime";
import { getFormattedPhoneNumber } from "../../../lib/phone-format";
import logger from "../../../logger";
import { r } from "../../models";
import { MessagingServiceType } from "../types";
import { symmetricDecrypt } from "./crypto";
import {
  appendServiceResponse,
  getCampaignContactAndAssignmentForIncomingMessage,
  getContactMessagingService,
  messageComponents,
  saveNewIncomingMessage,
  SpokeSendStatus
} from "./message-sending";

const MAX_SEND_ATTEMPTS = 5;
const MESSAGE_VALIDITY_PADDING_SECONDS = 30;
const MAX_TWILIO_MESSAGE_VALIDITY = 14400;

const getTwilioCredentials = async (messagingServiceSid) => {
  const { account_sid: accountSid, encrypted_auth_token } = await r
    .reader("messaging_service")
    .first(["account_sid", "encrypted_auth_token"])
    .where({
      messaging_service_sid: messagingServiceSid,
      service_type: "twilio"
    });
  const authToken = symmetricDecrypt(encrypted_auth_token);
  return { accountSid, authToken };
};

const twilioClient = async (messagingServiceSid) => {
  const { accountSid, authToken } = await getTwilioCredentials(
    messagingServiceSid
  );
  return Twilio(accountSid, authToken);
};

const headerValidator = () => {
  const { SKIP_TWILIO_VALIDATION, TWILIO_VALIDATION_HOST, BASE_URL } = config;
  if (SKIP_TWILIO_VALIDATION) return (req, res, next) => next();

  return async (req, res, next) => {
    const { MessagingServiceSid } = req.body;
    const { authToken } = await getTwilioCredentials(MessagingServiceSid);

    // Allow setting
    const host = TWILIO_VALIDATION_HOST
      ? TWILIO_VALIDATION_HOST !== ""
        ? TWILIO_VALIDATION_HOST
        : undefined
      : BASE_URL;

    const options = {
      validate: true,
      protocol: "https",
      host
    };

    return Twilio.webhook(authToken, options)(req, res, next);
  };
};

const textIncludingMms = (text, serviceMessages) => {
  const mediaUrls = [];
  serviceMessages.forEach((serviceMessage) => {
    const mediaUrlKeys = Object.keys(serviceMessage).filter((key) =>
      key.startsWith("MediaUrl")
    );
    mediaUrlKeys.forEach((key) => mediaUrls.push(serviceMessage[key]));
  });
  if (mediaUrls.length > 0) {
    const warningText =
      `Spoke Message:\n\nThis message contained ${mediaUrls.length} ` +
      "multimedia attachment(s) which Spoke does not display.";

    if (text === "") {
      text = warningText;
    } else {
      text = `${text}\n\n${warningText}`;
    }
  }

  return text;
};

async function convertMessagePartsToMessage(messageParts) {
  const firstPart = messageParts[0];
  const userNumber = firstPart.user_number;
  const contactNumber = firstPart.contact_number;
  const serviceMessages = messageParts.map((part) =>
    JSON.parse(part.service_message)
  );
  const text = serviceMessages
    .map((serviceMessage) => serviceMessage.Body)
    .join("")
    .replace(/\0/g, ""); // strip all UTF-8 null characters (0x00)

  const ccInfo = await getCampaignContactAndAssignmentForIncomingMessage({
    service: "twilio",
    contactNumber,
    messaging_service_sid: serviceMessages[0].MessagingServiceSid
  });

  return (
    ccInfo && {
      campaign_contact_id: ccInfo && ccInfo.campaign_contact_id,
      contact_number: contactNumber,
      user_number: userNumber,
      is_from_contact: true,
      text: textIncludingMms(text, serviceMessages),
      service_response: JSON.stringify(serviceMessages).replace(/\0/g, ""),
      service_id: serviceMessages[0].MessagingServiceSid,
      assignment_id: ccInfo && ccInfo.assignment_id,
      service: "twilio",
      send_status: "DELIVERED"
    }
  );
}

async function findNewCell(messagingSericeSid) {
  const twilio = await twilioClient(messagingSericeSid);
  return new Promise((resolve, reject) => {
    twilio.availablePhoneNumbers("US").local.list({}, (err, data) => {
      if (err) {
        reject(new Error(err));
      } else {
        resolve(data);
      }
    });
  });
}

async function rentNewCell(messagingSericeSid) {
  const twilio = await twilioClient(messagingSericeSid);
  const newCell = await findNewCell();

  if (
    newCell &&
    newCell.availablePhoneNumbers &&
    newCell.availablePhoneNumbers[0] &&
    newCell.availablePhoneNumbers[0].phone_number
  ) {
    return new Promise((resolve, reject) => {
      twilio.incomingPhoneNumbers.create(
        {
          phoneNumber: newCell.availablePhoneNumbers[0].phone_number,
          smsApplicationSid: messagingSericeSid
        },
        (err, purchasedNumber) => {
          if (err) {
            reject(err);
          } else {
            resolve(purchasedNumber.phone_number);
          }
        }
      );
    });
  }

  throw new Error("Did not find any cell");
}

async function sendMessage(message, organizationId, trx = r.knex) {
  const service = await getContactMessagingService(
    message.campaign_contact_id,
    organizationId
  );
  const messagingServiceSid = service.messaging_service_sid;
  const twilio = await twilioClient(messagingServiceSid);

  if (!twilio) {
    logger.error(
      "cannot actually send SMS message -- twilio is not fully configured",
      { messageId: message.id }
    );
    if (message.id) {
      await trx("message")
        .update({ send_status: "SENT", sent_at: trx.fn.now() })
        .where({ id: message.id });
    }
    return "test_message_uuid";
  }

  // TODO: refactor this -- the Twilio client supports promises now
  return new Promise((resolve, reject) => {
    if (message.service !== "twilio") {
      logger.warn("Message not marked as a twilio message", message.id);
    }

    const { body, mediaUrl } = messageComponents(message.text);
    const messageParams = {
      body,
      mediaUrl: mediaUrl || [],
      to: message.contact_number,
      messagingServiceSid,
      statusCallback: config.TWILIO_STATUS_CALLBACK_URL
    };

    let twilioValidityPeriod = config.TWILIO_MESSAGE_VALIDITY_PERIOD;

    if (message.send_before) {
      // the message is valid no longer than the time between now and
      // the send_before time, less 30 seconds
      // we subtract the MESSAGE_VALIDITY_PADDING_SECONDS seconds to allow time for the message to be sent by
      // a downstream service
      const messageValidityPeriod =
        (DateTime.fromISO(message.send_before) - DateTime.local()).seconds -
        MESSAGE_VALIDITY_PADDING_SECONDS;
      if (messageValidityPeriod < 0) {
        // this is an edge case
        // it means the message arrived in this function already too late to be sent
        // pass the negative validity period to twilio, and let twilio respond with an error
      }

      if (twilioValidityPeriod) {
        twilioValidityPeriod = Math.min(
          twilioValidityPeriod,
          messageValidityPeriod,
          MAX_TWILIO_MESSAGE_VALIDITY
        );
      } else {
        twilioValidityPeriod = Math.min(
          messageValidityPeriod,
          MAX_TWILIO_MESSAGE_VALIDITY
        );
      }
    }

    if (twilioValidityPeriod) {
      messageParams.validityPeriod = twilioValidityPeriod;
    }

    twilio.messages.create(messageParams, (err, response) => {
      const messageToSave = {
        ...message
      };
      let hasError = false;
      if (err) {
        hasError = true;
        logger.error(`Error sending message ${message.id}: `, err);
        const jsonErr = typeof err === "object" ? err : { error: err };
        messageToSave.service_response = appendServiceResponse(
          messageToSave.service_response,
          jsonErr
        );
      }
      if (response) {
        messageToSave.service_id = response.sid;
        hasError = !!response.error_code;
        messageToSave.service_response = appendServiceResponse(
          messageToSave.service_response,
          response
        );
      }

      if (hasError) {
        const SENT_STRING = '"status"'; // will appear in responses
        if (
          messageToSave.service_response.split(SENT_STRING).length >=
          MAX_SEND_ATTEMPTS + 1
        ) {
          messageToSave.send_status = "ERROR";
        }
        const { id: messageId, ...updatePayload } = messageToSave;
        trx("message")
          .update(updatePayload)
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
        const { id: messageId, ...updatePayload } = messageToSave;
        trx("message")
          .update({
            ...updatePayload,
            send_status: "SENT",
            service: "twilio",
            sent_at: trx.fn.now()
          })
          .where({ id: messageId })
          .returning("*")
          .then(([newMessage]) => resolve(newMessage));
      }
    });
  });
}

// Get appropriate Spoke message status from Twilio status
const getMessageStatus = (twilioStatus) => {
  if (twilioStatus === "delivered") {
    return "DELIVERED";
  }
  if (twilioStatus === "failed" || twilioStatus === "undelivered") {
    return "ERROR";
  }

  // Other Twilio statuses do not map to Spoke statuses and thus are ignored
};

// Delivery reports can arrive before sendMessage() has finished. In these cases,
// the message record in the database will not have a Twilio SID saved and the
// delivery report lookup will fail. To deal with this we prioritize recording
// the delivery report itself rather than updating the message. We can then "replay"
// the delivery reports back on the message table at a later date. We still attempt
// to update the message record status (after a slight delay).
const handleDeliveryReport = async (report) =>
  r.knex("log").insert({
    message_sid: report.MessageSid,
    service_type: MessagingServiceType.Twilio,
    body: JSON.stringify(report)
  });

export const processDeliveryReportBody = async (client, reportBody) => {
  const { MessageSid: service_id, MessageStatus } = reportBody;

  await client.query(
    `
      update message
      set
        service_response_at = now(),
        send_status = $1,
        service_response = (coalesce(service_response, '[]')::jsonb || cast($2 as jsonb))::text
      where
        service_id = $3
        and send_status not in  ($4, $5)
    `,
    [
      getMessageStatus(MessageStatus),
      JSON.stringify([reportBody]),
      service_id,
      SpokeSendStatus.Delivered,
      SpokeSendStatus.Error
    ]
  );
};

async function handleIncomingMessage(message) {
  if (
    !Object.prototype.hasOwnProperty.call(message, "From") ||
    !Object.prototype.hasOwnProperty.call(message, "To") ||
    !Object.prototype.hasOwnProperty.call(message, "Body") ||
    !Object.prototype.hasOwnProperty.call(message, "MessageSid")
  ) {
    logger.error("This is not an incoming message", { payload: message });
  }

  const { From, To, MessageSid } = message;
  const contactNumber = getFormattedPhoneNumber(From);
  const userNumber = To ? getFormattedPhoneNumber(To) : "";

  const pendingMessagePart = {
    service: "twilio",
    service_id: MessageSid,
    parent_id: null,
    service_message: JSON.stringify(message),
    user_number: userNumber,
    contact_number: contactNumber
  };

  if (!config.JOBS_SAME_PROCESS) {
    // If multiple processes, just insert the message part and let another job handle it
    await r.knex("pending_message_part").insert(pendingMessagePart);
  } else {
    // Handle the message directly and skip saving an intermediate part
    const finalMessage = await convertMessagePartsToMessage([
      pendingMessagePart
    ]);
    if (finalMessage) {
      await saveNewIncomingMessage(finalMessage);
    }
  }
}

export default {
  syncMessagePartProcessing: config.JOBS_SAME_PROCESS,
  headerValidator,
  convertMessagePartsToMessage,
  findNewCell,
  rentNewCell,
  sendMessage,
  saveNewIncomingMessage,
  handleDeliveryReport,
  processDeliveryReportBody,
  handleIncomingMessage
};
