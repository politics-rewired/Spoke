import Twilio from "twilio";
import _ from "lodash";
import { getFormattedPhoneNumber } from "../../../lib/phone-format";
import { Log, Message, PendingMessagePart, r } from "../../models";
import { log } from "../../../lib";
import { sleep } from "../../../lib/utils";
import {
  getCampaignContactAndAssignmentForIncomingMessage,
  saveNewIncomingMessage
} from "./message-sending";
import { symmetricDecrypt } from "./crypto";

const MAX_SEND_ATTEMPTS = 5;
const MESSAGE_VALIDITY_PADDING_S = 30;
const MAX_TWILIO_MESSAGE_VALIDITY = 60 * 60 * 4; // 4 hours

const headerValidator = () => {
  const {
    SKIP_TWILIO_VALIDATION,
    TWILIO_VALIDATION_HOST,
    BASE_URL
  } = process.env;
  if (!!SKIP_TWILIO_VALIDATION) return (req, res, next) => next();

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
  serviceMessages.forEach(serviceMessage => {
    const mediaUrlKeys = Object.keys(serviceMessage).filter(key =>
      key.startsWith("MediaUrl")
    );
    mediaUrlKeys.forEach(key => mediaUrls.push(serviceMessage[key]));
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
  const serviceMessages = messageParts.map(part =>
    JSON.parse(part.service_message)
  );
  const text = serviceMessages
    .map(serviceMessage => serviceMessage.Body)
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
      service_response: JSON.stringify(serviceMessages),
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

const mediaExtractor = new RegExp(/\[\s*(http[^\]\s]*)\s*\]/);

function parseMessageText(message) {
  const text = message.text || "";
  const params = {
    body: text.replace(mediaExtractor, "")
  };
  // Image extraction
  const results = text.match(mediaExtractor);
  if (results) {
    params.mediaUrl = results[1];
  }
  return params;
}

const assignMessagingServiceSID = async (cell, organizationId) => {
  const result = await r.knex.raw(
    `
      with chosen_messaging_service_sid as (
        select messaging_service_sid, count(*) as count
        from messaging_service_stick
        where organization_id = ?
        group by messaging_service_sid
        union
        select messaging_service_sid, 0
        from messaging_service
        where organization_id = ?
          and not exists (
            select 1
            from messaging_service_stick
            where 
              messaging_service_stick.messaging_service_sid = messaging_service.messaging_service_sid
          )
        order by count asc
        limit 1
    )
    insert into messaging_service_stick (cell, organization_id, messaging_service_sid)
    values (?, ?, (select messaging_service_sid from chosen_messaging_service_sid))
    returning messaging_service_sid;
    `,
    [organizationId, organizationId, cell, organizationId]
  );

  const chosen = result.rows[0].messaging_service_sid;
  return chosen;
};

const getMessageServiceSID = async (cell, organizationId) => {
  const { rows: existingStick } = await r.knex.raw(
    `
    select messaging_service_sid
    from messaging_service_stick
    where
      cell = ?
      and organization_id = ?
  `,
    [cell, organizationId]
  );

  const existingMessageServiceSid =
    existingStick[0] && existingStick[0].messaging_service_sid;

  if (existingMessageServiceSid) {
    return existingMessageServiceSid;
  }

  return await assignMessagingServiceSID(cell, organizationId);
};

const getTwilioCredentials = async messagingServiceSid => {
  const { account_sid: accountSid, encrypted_auth_token } = await r
    .knex("messaging_service")
    .first(["account_sid", "encrypted_auth_token"])
    .where({ messaging_service_sid: messagingServiceSid });
  const authToken = symmetricDecrypt(encrypted_auth_token);
  return { accountSid, authToken };
};

const twilioClient = async messagingServiceSid => {
  const { accountSid, authToken } = await getTwilioCredentials(
    messagingServiceSid
  );
  return Twilio(accountSid, authToken);
};

const getValidityPeriod = sendBefore => {
  // Calculate the number of seconds until sendBefore and subtract a small padding buffer.
  // TODO - this is local timezone, not UTC
  const secondsUntilSendBefore = Math.floor((sendBefore - Date.now()) / 1000);
  const validityPeriod = secondsUntilSendBefore - MESSAGE_VALIDITY_PADDING_S;

  const maxValidityPeriod = process.env.TWILIO_MESSAGE_VALIDITY_PERIOD
    ? process.env.TWILIO_MESSAGE_VALIDITY_PERIOD
    : MAX_TWILIO_MESSAGE_VALIDITY;

  // If this is less than 0, then sendMessage was already called too late.
  // Pass the buck and let Twilio respond with error
  return Math.min(validityPeriod, maxValidityPeriod);
};

async function sendMessage(message, organizationId, trx) {
  const knexObject = trx || r.knex;
  // Get (or assign) messaging service for contact's number
  const messagingServiceSid = await getMessageServiceSID(
    message.contact_number,
    organizationId
  );
  const twilio = await twilioClient(messagingServiceSid);

  const { send_before: sendBefore, contact_number: contactNumber } = message;
  const { body, mediaUrl } = parseMessageText(message);
  const validityPeriod = sendBefore ? getValidityPeriod(sendBefore) : undefined;
  const messageInstanceOptions = {
    to: contactNumber,
    messagingServiceSid,
    validityPeriod,
    body,
    mediaUrl
  };

  const updates = { service_response: message.service_response };
  try {
    const response = await twilio.messages.create(messageInstanceOptions);
    if (response.error_code) throw new Error(response);
    updates.service_id = response.sid;
    updates.service_response += JSON.stringify(response);
    updates.send_status = "SENT";
    updates.service = "twilio";
    updates.sent_at = knexObject.fn.now();
  } catch (exc) {
    updates.service_response += JSON.stringify(err);

    const statusCount = messageToSave.service_response.split("status").length;
    if (statusCount >= MAX_SEND_ATTEMPTS + 1) {
      updates.send_status = "ERROR";
    }
  } finally {
    const { rows } = await knexObject("message")
      .update(updates)
      .where({ id: message.id })
      .returning("*");
    return rows[0];
  }
}

// Get appropriate Spoke message status from Twilio status
const getMessageStatus = twilioStatus => {
  if (twilioStatus === "delivered") {
    return "DELIVERED";
  } else if (twilioStatus === "failed" || twilioStatus === "undelivered") {
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
async function handleDeliveryReport(report) {
  const { MessageSid: service_id, MessageStatus } = report;

  // Record the delivery report
  const insertResult = await r.knex("log").insert({
    message_sid: service_id,
    body: JSON.stringify(report)
  });

  // Kick off message update after delay, but don't wait around for result
  sleep(5000)
    .then(() =>
      r
        .knex("message")
        .update({
          service_response_at: r.knex.fn.now(),
          send_status: getMessageStatus(MessageStatus)
        })
        .where({ service_id })
    )
    .then(rowCount => {
      if (rowCount !== 1) {
        console.warn(
          `Received message report '${MessageStatus}' for Message SID ` +
            `'${service_id}' that matched ${rowCount} messages. Expected only 1 match.`
        );
      }
    })
    .catch(console.error);

  return insertResult;
}

async function handleIncomingMessage(message) {
  if (
    !message.hasOwnProperty("From") ||
    !message.hasOwnProperty("To") ||
    !message.hasOwnProperty("Body") ||
    !message.hasOwnProperty("MessageSid")
  ) {
    log.error(`This is not an incoming message: ${JSON.stringify(message)}`);
  }

  const { From, To, MessageSid } = message;
  const contactNumber = getFormattedPhoneNumber(From);
  const userNumber = To ? getFormattedPhoneNumber(To) : "";

  let pendingMessagePart = {
    service: "twilio",
    service_id: MessageSid,
    parent_id: null,
    service_message: JSON.stringify(message),
    user_number: userNumber,
    contact_number: contactNumber
  };

  if (!process.env.JOBS_SAME_PROCESS) {
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

function deterministicIntWithinRange(string, maxSize) {
  const hash = hashStr(string);
  const index = hash % maxSize;
  return index;
}

function hashStr(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    let charCode = str.charCodeAt(i);
    hash += charCode;
  }
  return hash;
}

// NOTE: This does not chunk inserts so make sure this is run only when you are sure the specified campaign
// has a reasonable size (< 1000) of cells without sticky messaging services.
const ensureAllNumbersHaveMessagingServiceSIDs = async (
  trx,
  campaignId,
  organizationId
) => {
  const { rows } = await trx.raw(
    `
    select distinct campaign_contact.cell
    from campaign_contact
    left join messaging_service_stick
      on messaging_service_stick.cell = campaign_contact.cell
        and messaging_service_stick.organization_id = ?
    where campaign_id = ?
      and messaging_service_stick.messaging_service_sid is null
  `,
    [organizationId, campaignId]
  );

  const cells = rows.map(r => r.cell);

  const { rows: messagingServiceCandidates } = await trx.raw(
    `
    select messaging_service_sid, count(*) as count
    from messaging_service_stick
    where organization_id = ?
    group by messaging_service_sid
    union
    select messaging_service_sid, 0
    from messaging_service
    where organization_id = ?
      and not exists (
        select 1
        from messaging_service_stick
        where 
          messaging_service_stick.messaging_service_sid = messaging_service.messaging_service_sid
      )
    order by count desc
  `,
    [organizationId, organizationId]
  );

  const toInsert = cells.map((c, idx) => {
    return {
      cell: c,
      organization_id: organizationId,
      messaging_service_sid:
        messagingServiceCandidates[idx % messagingServiceCandidates.length]
          .messaging_service_sid
    };
  });

  // const foundCells = await trx("messaging_service_stick")
  //   .pluck("cell")
  //   .where({ organization_id: organizationId })
  //   .whereIn("cell", rowsToInsert.map(r => r.cell));

  return await trx("messaging_service_stick").insert(toInsert);
};

export default {
  syncMessagePartProcessing: !!process.env.JOBS_SAME_PROCESS,
  headerValidator,
  convertMessagePartsToMessage,
  findNewCell,
  rentNewCell,
  sendMessage,
  saveNewIncomingMessage,
  handleDeliveryReport,
  handleIncomingMessage,
  parseMessageText,
  ensureAllNumbersHaveMessagingServiceSIDs
};
