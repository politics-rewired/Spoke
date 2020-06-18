import NumbersClient from "assemble-numbers-client";

import { config } from "../../../config";
import logger from "../../../logger";
import { errToObj } from "../../utils";
import { r } from "../../models";
import { getFormattedPhoneNumber } from "../../../lib/phone-format";
import { sleep } from "../../../lib/utils";
import { symmetricDecrypt } from "./crypto";
import {
  SpokeSendStatus,
  getMessagingServiceById,
  getContactMessagingService,
  messageComponents,
  getCampaignContactAndAssignmentForIncomingMessage,
  saveNewIncomingMessage
} from "./message-sending";

export const NumbersSendStatus = Object.freeze({
  Queued: "queued",
  Sending: "sending",
  Sent: "sent",
  Delivered: "delivered",
  SendingFailed: "sending_failed",
  DeliveryFailed: "delivery_failed",
  DeliveryUnconfirmed: "delivery_unconfirmed"
});

/**
 * Create an Assemble Numbers client
 * @param {object} numbersService Assemble Numbers Messaging Service record
 * @returns Assemble Numbers JS client
 */
export const numbersClient = async numbersService => {
  const encryptedApiKey = numbersService.encrypted_auth_token;
  const apiKey = symmetricDecrypt(encryptedApiKey);
  const client = new NumbersClient({ apiKey });
  return client;
};

export const inboundMessageValidator = () => async (req, res, next) => {
  // Check if the 'x-assemble-signature' header exists or not
  if (!req.header("x-assemble-signature")) {
    return res
      .type("text/plain")
      .status(400)
      .send(
        "No signature header error - x-assemble-signature header does not exist, maybe this request is not coming from Assemble."
      );
  }

  const signature = req.header("x-assemble-signature");
  const { id: messageId, profileId } = req.body;

  const service = await getMessagingServiceById(profileId);
  const numbers = await numbersClient(service);
  const isValid = numbers.validateInboundMessageWebhook(messageId, signature);

  if (isValid) {
    next();
  } else {
    return res
      .type("text/plain")
      .status(403)
      .send("Assemble Request Validation Failed.");
  }
};

export const deliveryReportValidator = () => async (req, res, next) => {
  // Check if the 'x-assemble-signature' header exists or not
  if (!req.header("x-assemble-signature")) {
    return res
      .type("text/plain")
      .status(400)
      .send(
        "No signature header error - x-assemble-signature header does not exist, maybe this request is not coming from Assemble."
      );
  }

  const signature = req.header("x-assemble-signature");
  const { id: messageId, eventType, profileId } = req.body;

  const service = await getMessagingServiceById(profileId);
  const numbers = await numbersClient(service);
  const isValid = numbers.validateDeliveryReportWebhook(
    messageId,
    eventType,
    signature
  );

  if (isValid) {
    next();
  } else {
    return res
      .type("text/plain")
      .status(403)
      .send("Assemble Request Validation Failed.");
  }
};

export const sendMessage = async (message, organizationId, _trx) => {
  const {
    id: spokeMessageId,
    campaign_contact_id: campaignContactId,
    contact_number: to,
    text: messageText
  } = message;
  const service = await getContactMessagingService(
    campaignContactId,
    organizationId
  );
  const profileId = service.messaging_service_sid;
  const numbers = await numbersClient(service);

  const { zip: contactZipCode } = await r
    .reader("campaign_contact")
    .where({ id: campaignContactId })
    .first("zip");
  const { body, mediaUrl } = messageComponents(messageText);
  const mediaUrls = mediaUrl ? [mediaUrl] : undefined;
  const messageInput = {
    profileId,
    to,
    body,
    mediaUrls,
    contactZipCode: contactZipCode === "" ? null : contactZipCode
  };
  try {
    const result = await numbers.sms.sendMessage(messageInput);
    const { data, errors } = result;

    if (errors && errors.length > 0) throw new Error(errors[0].message);

    const { id: serviceId } = data.sendMessage.outboundMessage;
    await r
      .knex("message")
      .update({
        service_id: serviceId,
        send_status: SpokeSendStatus.Sent,
        sent_at: r.knex.fn.now(),
        service_response: JSON.stringify([result])
      })
      .where({ id: spokeMessageId });
  } catch (exc) {
    logger.error({
      message: `"Error sending message with Assemble Numbers: ${exc.message}`,
      stack: exc.stack,
      messageInput
    });
    await r
      .knex("message")
      .update({ send_status: SpokeSendStatus.Error })
      .where({ id: spokeMessageId });
  }
};

/**
 * Map an Assemble Numbers event type to a Spoke send status
 * @param {string} assembleNumbersStatus The event type returned by Assemble Numbers
 * @returns {string} Spoke send status
 */
const getMessageStatus = assembleNumbersStatus => {
  switch (assembleNumbersStatus) {
    case NumbersSendStatus.Queued:
      return SpokeSendStatus.Queued;
    case NumbersSendStatus.Sending:
      return SpokeSendStatus.Sending;
    case NumbersSendStatus.Sent:
      return SpokeSendStatus.Sent;
    case NumbersSendStatus.Delivered:
      return SpokeSendStatus.Delivered;
    case NumbersSendStatus.SendingFailed:
    case NumbersSendStatus.DeliveryFailed:
    case NumbersSendStatus.DeliveryUnconfirmed:
      return SpokeSendStatus.Error;
  }
};

/**
 * Process an Assemble Numbers delivery report
 * @param {object} reportBody Assemble Numbers delivery report
 */
export const handleDeliveryReport = async reportBody => {
  const { eventType, messageId } = reportBody;

  // Record the delivery report
  const insertResult = await r.knex("log").insert({
    message_sid: messageId,
    body: JSON.stringify(reportBody)
  });

  // Kick off message update after delay, but don't wait around for result
  sleep(5000)
    .then(() => {
      const message = r
        .knex("message")
        .where({ service_id: messageId })
        .first("send_status");

      if (message.send_status !== SpokeSendStatus.Delivered) {
        return r
          .knex("message")
          .update({
            service_response_at: r.knex.fn.now(),
            send_status: getMessageStatus(eventType)
          })
          .where({ service_id: messageId });
      } else {
        return message ? 1 : 0;
      }
    })
    .then(rowCount => {
      if (rowCount !== 1) {
        logger.warn(
          `Received Assemble Numbers message report '${eventType}' for Message ID ` +
            `'${messageId}' that matched ${rowCount} messages. Expected only 1 match.`
        );
      }
    })
    .catch(err =>
      logger.error("Error handling Assemble Numbers delivery report: ", {
        ...errToObj(err),
        reportBody
      })
    );

  return insertResult;
};

/**
 * Embed warning text for the user into the body of the message when receiving media attachments.
 * @param {string} body The body (text) of the inbound message
 * @param {number} numMedia The number of media attachments
 */
const formatInboundBody = (body, numMedia) => {
  let text = body.replace(/\0/g, ""); // strip all UTF-8 null characters (0x00)

  if (numMedia > 0) {
    const warningText = `Spoke Message:\n\nThis message contained ${numMedia} multimedia attachment(s) which Spoke does not display.`;
    const padding = text === "" ? "" : "\n\n";
    text = `${text}${padding}${warningText}`;
  }

  return text;
};

/**
 * Convert an inbound Assemble Numbers message object to a Spoke message record.
 * @param {object} assembleMessage The Assemble Numbers message object
 * @returns Spoke message object
 */
const convertInboundMessage = async assembleMessage => {
  const {
    id: serviceId,
    body,
    from,
    to,
    numMedia,
    profileId
  } = assembleMessage;
  const contactNumber = getFormattedPhoneNumber(from);
  const userNumber = getFormattedPhoneNumber(to);

  const ccInfo = await getCampaignContactAndAssignmentForIncomingMessage({
    service: "assemble-numbers",
    contactNumber,
    messaging_service_sid: profileId
  });

  if (!ccInfo) {
    logger.error(
      "Could not match inbound assemble message to existing conversation",
      { payload: assembleMessage }
    );
    return;
  }

  const spokeMessage = {
    campaign_contact_id: ccInfo && ccInfo.campaign_contact_id,
    contact_number: contactNumber,
    user_number: userNumber,
    is_from_contact: true,
    text: formatInboundBody(body, numMedia),
    service_response: JSON.stringify([assembleMessage]).replace(/\0/g, ""),
    service_id: serviceId,
    assignment_id: ccInfo && ccInfo.assignment_id,
    service: "assemble-numbers",
    send_status: SpokeSendStatus.Delivered
  };

  return spokeMessage;
};

/**
 * Convert an array of unprocessed message parts to a final Spoke message.
 * @param {object[]} messageParts Records of inbound Assemble Numbers messages
 * @returns Spoke message object
 */
export const convertMessagePartsToMessage = async messageParts =>
  convertInboundMessage(JSON.parse(messageParts[0].service_message));

/**
 * Process an inbound Assemble Numbers message.
 * @param {object} message Inbound Assemble Numbers message object
 */
export const handleIncomingMessage = async message => {
  if (config.JOBS_SAME_PROCESS) {
    const inboundMessage = await convertInboundMessage(message);
    // Only persist the message if it was matched to an existing conversation
    if (inboundMessage) {
      await saveNewIncomingMessage(inboundMessage);
    }
  } else {
    const { id: serviceId, from, to } = message;
    const contactNumber = getFormattedPhoneNumber(from);
    const userNumber = getFormattedPhoneNumber(to);

    const pendingMessagePart = {
      service: "assemble-numbers",
      service_id: serviceId,
      parent_id: null,
      service_message: JSON.stringify(message),
      user_number: userNumber,
      contact_number: contactNumber
    };
    await r.knex("pending_message_part").insert(pendingMessagePart);
  }
};

export default {
  sendMessage,
  inboundMessageValidator,
  deliveryReportValidator,
  handleDeliveryReport,
  handleIncomingMessage,
  convertMessagePartsToMessage
};
