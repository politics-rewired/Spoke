/* eslint-disable no-cond-assign */
import { format } from "fast-csv";
import _ from "lodash";
import moment from "moment";
import { Task } from "pg-compose";

import logger from "../../logger";
import { getDownloadUrl, getUploadStream } from "../../workers/exports/upload";
import { deleteJob } from "../../workers/jobs";
import {
  CampaignContactRecord,
  InteractionStepRecord,
  JobRequestRecord,
  MessageRecord,
  UserRecord
} from "../api/types";
import { sendEmail } from "../mail";
import { r } from "../models";
import { addProgressJob } from "./utils";

const CHUNK_SIZE = 1000;

interface ExportChunk {
  lastContactId: number;
}

interface ContactsChunk extends ExportChunk {
  contacts: { [key: string]: string }[];
}

interface MessagesChunk extends ExportChunk {
  messages: { [key: string]: any }[];
}

const stepHasQuestion = (step: InteractionStepRecord) =>
  step.question && step.question.trim() !== "";

/**
 * Returns map from interaction step ID --> question text (deduped where appropriate).
 * @param {object[]} interactionSteps Array of interaction steps to work on.
 */
export const getUniqueQuestionsByStepId = (
  interactionSteps: InteractionStepRecord[]
) => {
  const questionSteps = interactionSteps.filter(stepHasQuestion);
  const duplicateQuestions = _.groupBy(questionSteps, (step) => step.question);

  return Object.keys(duplicateQuestions).reduce(
    (allQuestions, questionText) => {
      const steps = duplicateQuestions[questionText];
      const newUniqueQuestions =
        steps.length > 1
          ? steps.reduce(
              (collector, step, index) =>
                Object.assign(collector, {
                  [step.id]: `${questionText}_${index + 1}`
                }),
              {}
            )
          : { [steps[0].id]: questionText };

      return Object.assign(allQuestions, newUniqueQuestions);
    },
    {}
  );
};

/**
 * Fetch necessary job data from database.
 * @param {object} job The export job object to fetch data for.
 *                     Must have payload, campaign_id, and requester properties.
 */

export const fetchExportData = async (
  campaignId: number,
  requesterId: string,
  isAutomatedExport = false
) => {
  const { title: campaignTitle } = await r
    .reader("campaign")
    .first("title")
    .where({ id: campaignId });

  const { email: notificationEmail } = await r
    .reader("user")
    .first("email")
    .where({ id: requesterId });

  const interactionSteps = await r
    .reader("interaction_step")
    .select("*")
    .where({ campaign_id: campaignId });

  const assignments = await r
    .reader("assignment")
    .where("campaign_id", campaignId)
    .join("user", "user_id", "user.id")
    .select(
      "assignment.id as id",
      "user.first_name",
      "user.last_name",
      "user.email",
      "user.cell",
      "user.assigned_cell"
    );

  return {
    campaignId,
    campaignTitle,
    notificationEmail,
    interactionSteps,
    assignments,
    isAutomatedExport
  };
};

interface ContactExportRow extends CampaignContactRecord {
  city: string;
  state: string;
  interaction_step_id: number;
  value: string;
  tag_titles: string;
}

export const processContactsChunk = async (
  campaignId: number,
  campaignTitle: string,
  questionsById: { [key: string]: string },
  lastContactId = 0
): Promise<ContactsChunk | false> => {
  const { rows }: { rows: ContactExportRow[] } = await r.reader.raw(
    `
      with campaign_contacts as (
        select *
        from campaign_contact
        where
          campaign_id = ?
          and id > ?
        order by
          campaign_contact.id asc
        limit ?
      )
      select
        campaign_contacts.*,
        zip_code.city,
        zip_code.state,
        question_response.interaction_step_id,
        question_response.value,
        tags.tag_titles
      from campaign_contacts
      left join question_response
        on question_response.campaign_contact_id = campaign_contacts.id
      left join zip_code
        on zip_code.zip = campaign_contacts.zip
      left join (
          select 
            campaign_contact_tag.campaign_contact_id,
            array_agg(tag.title) as tag_titles
          from campaign_contact_tag
          join tag
            on campaign_contact_tag.tag_id = tag.id
          group by campaign_contact_tag.campaign_contact_id
        ) as tags
        on tags.campaign_contact_id = campaign_contacts.id
        order by campaign_contacts.id asc
      ;
    `,
    [campaignId, lastContactId, CHUNK_SIZE]
  );

  if (rows.length === 0) return false;

  lastContactId = rows[rows.length - 1].id;

  const rowsByContactId = _.groupBy(rows, (row) => row.id);
  const contacts = Object.keys(rowsByContactId).map((contactId) => {
    // Use the first row for all the common campaign contact fields
    const contact = rowsByContactId[contactId][0];
    const contactRow: { [key: string]: any } = {
      campaignId,
      campaign: campaignTitle,
      "contact[firstName]": contact.first_name,
      "contact[lastName]": contact.last_name,
      "contact[cell]": contact.cell,
      "contact[zip]": contact.zip,
      "contact[city]": contact.city || null,
      "contact[state]": contact.state || null,
      "contact[optOut]": contact.is_opted_out,
      "contact[messageStatus]": contact.message_status,
      "contact[external_id]": contact.external_id
    };

    // Append columns for custom fields
    const customFields = JSON.parse(contact.custom_fields);
    Object.keys(customFields).forEach((fieldName) => {
      contactRow[`contact[${fieldName}]`] = customFields[fieldName];
    });

    // Append columns for question responses
    Object.keys(questionsById).forEach((stepId) => {
      const questionText = questionsById[stepId];
      const response = rowsByContactId[contactId].find(
        (qr) =>
          parseInt(`${qr.interaction_step_id}`, 10) === parseInt(stepId, 10)
      );

      const responseValue = response ? response.value : "";
      contactRow[`question[${questionText}]`] = responseValue;
    });

    contactRow.tags = contact.tag_titles;

    return contactRow;
  });

  return { lastContactId, contacts };
};

interface MessageExportRow
  extends Pick<
      MessageRecord,
      | "campaign_contact_id"
      | "assignment_id"
      | "user_number"
      | "contact_number"
      | "is_from_contact"
      | "text"
      | "send_status"
      | "created_at"
      | "num_segments"
      | "num_media"
    >,
    Pick<UserRecord, "first_name" | "last_name" | "email"> {
  error_codes: string;
  user_cell: string;
}

export const processMessagesChunk = async (
  campaignId: number,
  lastContactId = 0
): Promise<MessagesChunk | false> => {
  const { rows }: { rows: MessageExportRow[] } = await r.reader.raw(
    `
      select
        message.campaign_contact_id,
        message.assignment_id,
        message.user_number,
        message.contact_number,
        message.is_from_contact,
        message.text,
        message.send_status,
        message.created_at,
        array_to_string(message.error_codes, '|') as error_codes,
        message.num_segments,
        message.num_media,
        public.user.first_name,
        public.user.last_name,
        public.user.email,
        public.user.cell as user_cell
      from message
      left join public.user
        on message.user_id = public.user.id
      where campaign_contact_id in (
        select id
        from campaign_contact
        where
          campaign_id = ?
          and id > ?
          and exists (
            select 1
            from message
            where campaign_contact_id = campaign_contact.id 
          )
        order by
          id asc
        limit ?
      )
      order by
        campaign_contact_id asc,
        message.created_at asc
      ;
    `,
    [campaignId, lastContactId, CHUNK_SIZE]
  );

  if (rows.length === 0) return false;

  lastContactId = rows[rows.length - 1].campaign_contact_id;

  const messages = rows.map((message) => ({
    assignmentId: message.assignment_id,
    userNumber: message.user_number,
    contactNumber: message.contact_number,
    isFromContact: message.is_from_contact,
    numSegments: message.num_segments,
    numMedia: message.num_media,
    sendStatus: message.send_status,
    errorCodes: message.error_codes,
    attemptedAt: moment(message.created_at).toISOString(),
    text: message.text,
    campaignId,
    "texter[firstName]": message.first_name,
    "texter[lastName]": message.last_name,
    "texter[email]": message.email,
    "texter[cell]": message.user_cell
  }));

  return { lastContactId, messages };
};

export const exportCampaign: Task = async (
  payload: JobRequestRecord,
  _helpers
) => {
  const { payload: context, campaign_id, requester } = payload;

  await addProgressJob("export-campaign", payload);
  const {
    campaignId,
    campaignTitle,
    notificationEmail,
    interactionSteps,
    assignments: _assignments,
    isAutomatedExport
  } = await fetchExportData(campaign_id, requester);

  const countQueryResult = await r
    .reader("campaign_contact")
    .count("*")
    .where({ campaign_id: campaignId });
  const contactsCount = countQueryResult[0].count;

  const uniqueQuestionsByStepId = getUniqueQuestionsByStepId(interactionSteps);

  // Attempt upload to cloud storage
  let campaignContactsKey = campaignTitle
    .replace(/ /g, "_")
    .replace(/\//g, "_");

  if (!isAutomatedExport) {
    const timestamp = moment().format("YYYY-MM-DD-HH-mm-ss");
    campaignContactsKey = `${campaignContactsKey}-${timestamp}`;
  }
  const messagesKey = `${campaignContactsKey}-messages`;

  const campaignContactsUploadStream = await getUploadStream(
    `${campaignContactsKey}.csv`
  );
  const campaignContactsWriteStream = format({
    headers: true,
    writeHeaders: true
  });

  campaignContactsUploadStream.on("error", (err) => {
    logger.error("error in campaignContactsUploadStream: ", err);
  });
  campaignContactsWriteStream.on("error", (err) => {
    logger.error("error in campaignContactsWriteStream: ", err);
  });

  const campaignContactsUploadPromise = new Promise((resolve) =>
    campaignContactsUploadStream.on("finish", resolve)
  );

  campaignContactsWriteStream.pipe(campaignContactsUploadStream);

  const messagesUploadStream = await getUploadStream(`${messagesKey}.csv`);
  const messagesWriteStream = format({
    headers: true,
    writeHeaders: true
  });

  messagesUploadStream.on("error", (err) => {
    logger.error("error in messagesUploadStream: ", err);
  });
  messagesWriteStream.on("error", (err) => {
    logger.error("error in messagesWriteStream: ", err);
  });

  const messagesUploadPromise = new Promise((resolve) =>
    messagesUploadStream.on("finish", resolve)
  );

  messagesWriteStream.pipe(messagesUploadStream);

  // Message rows
  let lastContactId;
  let processed = 0;
  try {
    let chunkMessageResult: MessagesChunk | false;
    lastContactId = 0;
    while (
      (chunkMessageResult = await processMessagesChunk(
        campaignId,
        lastContactId
      ))
    ) {
      lastContactId = chunkMessageResult.lastContactId;
      logger.debug(
        `Processing message export for ${campaignId} chunk part ${lastContactId}`
      );
      processed += CHUNK_SIZE;
      await r
        .knex("job_request")
        .where({ id: payload.id })
        .update({
          status: Math.round((processed / contactsCount / 2) * 100)
        });
      for (const m of chunkMessageResult.messages) {
        messagesWriteStream.write(m);
      }
    }
  } finally {
    messagesWriteStream.end();
  }

  // Contact rows
  try {
    let chunkContactResult: ContactsChunk | false;
    lastContactId = 0;
    processed = 0;
    while (
      (chunkContactResult = await processContactsChunk(
        campaignId,
        campaignTitle,
        uniqueQuestionsByStepId,
        lastContactId
      ))
    ) {
      lastContactId = chunkContactResult.lastContactId;
      logger.debug(
        `Processing contact export for ${campaignId} chunk part ${lastContactId}`
      );
      processed += CHUNK_SIZE;
      await r
        .knex("job_request")
        .where({ id: payload.id })
        .update({
          status: Math.round((processed / contactsCount / 2) * 100) + 50
        });
      for (const c of chunkContactResult.contacts) {
        campaignContactsWriteStream.write(c);
      }
    }
  } finally {
    campaignContactsWriteStream.end();
  }

  logger.debug("Waiting for streams to finish");
  await Promise.all([campaignContactsUploadPromise, messagesUploadPromise]);

  try {
    const [campaignExportUrl, campaignMessagesExportUrl] = await Promise.all([
      getDownloadUrl(`${campaignContactsKey}.csv`),
      getDownloadUrl(`${messagesKey}.csv`)
    ]);
    if (!isAutomatedExport) {
      await sendEmail({
        to: notificationEmail,
        subject: `Export ready for ${campaignTitle}`,
        text:
          `Your Spoke exports are ready! These URLs will be valid for 24 hours.` +
          `\n\nCampaign export:\n${campaignExportUrl}` +
          `\n\nMessage export:\n${campaignMessagesExportUrl}`
      });
    }
    logger.info(`Successfully exported ${campaignId}`);
  } finally {
    logger.info("Finishing export process");
  }

  // Attempt to delete job ("why would a job ever _not_ have an id?" - bchrobot)
  if (payload.id) {
    await deleteJob(payload.id);
  } else {
    logger.debug(payload);
  }
};

export default exportCampaign;
