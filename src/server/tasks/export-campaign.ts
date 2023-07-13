/* eslint-disable no-cond-assign */
import { format } from "fast-csv";
import _ from "lodash";

import { config } from "../../config";
import { DateTime } from "../../lib/datetime";
import { getDownloadUrl, getUploadStream } from "../../workers/exports/upload";
import getExportCampaignContent from "../api/export-campaign";
import type {
  CampaignContactRecord,
  FilteredContactRecord,
  InteractionStepRecord,
  MessageRecord,
  UserRecord
} from "../api/types";
import { sendEmail } from "../mail";
import { r } from "../models";
import { errToObj } from "../utils";
import type { ProgressTask, ProgressTaskHelpers } from "./utils";
import { addProgressJob } from "./utils";

export const TASK_IDENTIFIER = "export-campaign";

const CHUNK_SIZE = config.EXPORT_CAMPAIGN_CHUNK_SIZE;

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
  requesterId: number
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

  const campaignVariableNames: string[] = await r
    .reader<{ name: string }>("campaign_variable")
    .where("campaign_id", campaignId)
    .distinct("name")
    .then((rows) => rows.map(({ name }) => name));

  return {
    campaignTitle,
    notificationEmail,
    interactionSteps,
    campaignVariableNames,
    assignments
  };
};

interface FilteredContactsRow extends FilteredContactRecord {
  city: string;
  state: string;
}

const processFilteredContactsChunk = async (
  campaignId: number,
  campaignTitle: string,
  lastContactId = 0
): Promise<ContactsChunk | false> => {
  const filteredRows: FilteredContactsRow[] = await r
    .reader("filtered_contact")
    .select("filtered_contact.*", "zip_code.city", "zip_code.state")
    .leftJoin("zip_code", "filtered_contact.zip", "zip_code.zip")
    .where({ campaign_id: campaignId })
    .whereRaw("filtered_contact.id > ?", [lastContactId])
    .orderBy("filtered_contact.id", "asc")
    .limit(CHUNK_SIZE);

  const newLastContactId = filteredRows?.at(-1)?.id ?? 0;

  if (newLastContactId === 0) return false;

  const contacts = filteredRows.map((contact) => {
    const contactRow: { [key: string]: any } = {
      "contact[filtered_reason]": contact.filtered_reason,
      campaignId,
      campaign: campaignTitle,
      "contact[firstName]": contact.first_name,
      "contact[lastName]": contact.last_name,
      "contact[cell]": contact.cell,
      "contact[zip]": contact.zip,
      "contact[city]": contact.city || null,
      "contact[state]": contact.state || null,
      "contact[messageStatus]": "removed",
      "contact[external_id]": contact.external_id
    };

    // Append columns for custom fields
    const customFields = JSON.parse(contact.custom_fields);
    Object.keys(customFields).forEach((fieldName) => {
      contactRow[`contact[${fieldName}]`] = customFields[fieldName];
    });

    return contactRow;
  });

  return { lastContactId: newLastContactId, contacts };
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
  lastContactId = 0,
  onlyOptOuts = false
): Promise<ContactsChunk | false> => {
  const { rows }: { rows: ContactExportRow[] } = await r.reader.raw(
    `
      with campaign_contacts as (
        select *
        from campaign_contact
        where
          campaign_id = ?
          and id > ?
          ${onlyOptOuts ? "and is_opted_out = true" : ""}
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
  campaign_variables: Record<string, string>;
}

export const processMessagesChunk = async (
  campaignId: number,
  campaignVariableNames: string[],
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
        public.user.cell as user_cell,
        (
          select json_object(array_agg(name), array_agg(value))
          from campaign_variable
          where id = ANY(message.campaign_variable_ids)
        )  as campaign_variables
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

  const campaignVariableColumns = (message: MessageExportRow) =>
    campaignVariableNames.reduce<Record<string, string | null>>(
      (acc, variableName) => ({
        ...acc,
        [`campaignVariable[${variableName}]`]: message.campaign_variables
          ? message.campaign_variables[variableName] ?? null
          : null
      }),
      {}
    );

  const messages = rows.map((message) => ({
    assignmentId: message.assignment_id,
    userNumber: message.user_number,
    contactNumber: message.contact_number,
    isFromContact: message.is_from_contact,
    numSegments: message.num_segments,
    numMedia: message.num_media,
    sendStatus: message.send_status,
    errorCodes: message.error_codes,
    attemptedAt: DateTime.fromJSDate(new Date(message.created_at)).toISO(),
    text: message.text,
    campaignId,
    "texter[firstName]": message.first_name,
    "texter[lastName]": message.last_name,
    "texter[email]": message.email,
    "texter[cell]": message.user_cell,
    ...campaignVariableColumns(message)
  }));

  return { lastContactId, messages };
};

interface UploadCampaignContacts {
  campaignTitle: string;
  interactionSteps: Array<any>;
  contactsCount: number;
  campaignId: number;
  helpers: ProgressTaskHelpers;
  fileNameKey: string;
  onlyOptOuts: boolean;
}

const processAndUploadCampaignContacts = async ({
  campaignTitle,
  interactionSteps,
  contactsCount,
  campaignId,
  helpers,
  fileNameKey,
  onlyOptOuts
}: UploadCampaignContacts): Promise<string> => {
  const uniqueQuestionsByStepId = getUniqueQuestionsByStepId(interactionSteps);

  const campaignContactsKey = onlyOptOuts
    ? `${fileNameKey}-optouts`
    : fileNameKey;

  const campaignContactsUploadStream = await getUploadStream(
    `${campaignContactsKey}.csv`
  );

  const campaignContactsWriteStream = format({
    headers: true,
    writeHeaders: true
  });

  campaignContactsUploadStream.on("error", (err) => {
    helpers.logger.error(
      "error in campaignContactsUploadStream: ",
      errToObj(err)
    );
  });

  campaignContactsWriteStream.on("error", (err) => {
    helpers.logger.error(
      "error in campaignContactsWriteStream: ",
      errToObj(err)
    );
  });

  const campaignContactsUploadPromise = new Promise((resolve) => {
    campaignContactsUploadStream.on("finish", resolve);
  });

  campaignContactsWriteStream.pipe(campaignContactsUploadStream);

  // Contact rows
  let lastContactId;
  let processed = 0;
  try {
    let chunkContactResult: ContactsChunk | false;
    lastContactId = 0;
    processed = 0;
    while (
      (chunkContactResult = await processContactsChunk(
        campaignId,
        campaignTitle,
        uniqueQuestionsByStepId,
        lastContactId,
        onlyOptOuts
      ))
    ) {
      lastContactId = chunkContactResult.lastContactId;
      helpers.logger.debug(
        `Processing contact export for ${campaignId} chunk part ${lastContactId}`
      );
      processed += CHUNK_SIZE;
      await helpers.updateStatus(
        Math.round((processed / contactsCount / 4) * 100) +
          (onlyOptOuts ? 75 : 25)
      );
      for (const c of chunkContactResult.contacts) {
        campaignContactsWriteStream.write(c);
      }
    }
  } finally {
    campaignContactsWriteStream.end();
  }

  await campaignContactsUploadPromise;

  return getDownloadUrl(`${campaignContactsKey}.csv`);
};

interface UploadCampaignMessages {
  fileNameKey: string;
  contactsCount: number;
  helpers: ProgressTaskHelpers;
  campaignId: number;
  campaignVariableNames: string[];
}

const processAndUploadCampaignMessages = async ({
  fileNameKey,
  contactsCount,
  helpers,
  campaignId,
  campaignVariableNames
}: UploadCampaignMessages): Promise<string> => {
  const messagesKey = `${fileNameKey}-messages`;
  const messagesUploadStream = await getUploadStream(`${messagesKey}.csv`);
  const messagesWriteStream = format({
    headers: true,
    writeHeaders: true
  });

  messagesUploadStream.on("error", (err) => {
    helpers.logger.error("error in messagesUploadStream: ", errToObj(err));
  });
  messagesWriteStream.on("error", (err) => {
    helpers.logger.error("error in messagesWriteStream: ", errToObj(err));
  });

  const messagesUploadPromise = new Promise((resolve) => {
    messagesUploadStream.on("finish", resolve);
  });

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
        campaignVariableNames,
        lastContactId
      ))
    ) {
      lastContactId = chunkMessageResult.lastContactId;
      helpers.logger.debug(
        `Processing message export for ${campaignId} chunk part ${lastContactId}`
      );
      processed += CHUNK_SIZE;
      await helpers.updateStatus(
        Math.round((processed / contactsCount / 4) * 100)
      );
      for (const m of chunkMessageResult.messages) {
        messagesWriteStream.write(m);
      }
    }
  } finally {
    messagesWriteStream.end();
  }

  await messagesUploadPromise;

  return getDownloadUrl(`${messagesKey}.csv`);
};

interface UploadFilteredContacts {
  fileNameKey: string;
  helpers: ProgressTaskHelpers;
  campaignId: number;
  campaignTitle: string;
}

const processAndUploadFilteredContacts = async ({
  fileNameKey,
  helpers,
  campaignId,
  campaignTitle
}: UploadFilteredContacts): Promise<string> => {
  const filteredContactsKey = `${fileNameKey}-filteredContacts`;
  const filteredContactsUploadStream = await getUploadStream(
    `${filteredContactsKey}.csv`
  );
  const filteredContactsWriteStream = format({
    headers: true,
    writeHeaders: true
  });

  filteredContactsUploadStream.on("error", (err) => {
    helpers.logger.error(
      "error in filteredContactsUploadStream: ",
      errToObj(err)
    );
  });
  filteredContactsWriteStream.on("error", (err) => {
    helpers.logger.error(
      "error in filteredContactsWriteStream: ",
      errToObj(err)
    );
  });

  const filteredContactsUploadPromise = new Promise((resolve) => {
    filteredContactsUploadStream.on("finish", resolve);
  });

  const countQuery = await r
    .reader("filtered_contact")
    .count("*")
    .where({ campaign_id: campaignId });
  const contactsCount = countQuery[0].count as number;

  filteredContactsWriteStream.pipe(filteredContactsUploadStream);

  let lastContactId;
  let processed = 0;
  try {
    let chunkContactResult: ContactsChunk | false;
    lastContactId = 0;
    processed = 0;
    while (
      (chunkContactResult = await processFilteredContactsChunk(
        campaignId,
        campaignTitle,
        lastContactId
      ))
    ) {
      lastContactId = chunkContactResult.lastContactId;
      helpers.logger.debug(
        `Processing filtered contact export for ${campaignId} chunk part ${lastContactId}`
      );
      processed += CHUNK_SIZE;
      await helpers.updateStatus(
        Math.round((processed / contactsCount / 4) * 100) + 75
      );
      for (const c of chunkContactResult.contacts) {
        filteredContactsWriteStream.write(c);
      }
    }
  } finally {
    filteredContactsWriteStream.end();
  }

  await filteredContactsUploadPromise;

  return getDownloadUrl(`${filteredContactsKey}.csv`);
};

export interface SpokeOptions {
  campaign: boolean;
  messages: boolean;
  optOuts: boolean;
  filteredContacts: boolean;
}

export interface CampaignDataForExport {
  fileNameKey: any;
  campaignId: number;
  campaignTitle: any;
  contactsCount: number;
  helpers: ProgressTaskHelpers;
  interactionSteps: any[];
  campaignVariableNames: string[];
}

// kicks off export processes and returns url for email
export const processExportData = async (
  campaignData: CampaignDataForExport,
  spokeOptions: SpokeOptions
) => {
  const {
    campaign: shouldExportCampaign,
    filteredContacts: shouldExportFilteredContacts,
    messages: shouldExportMessages,
    optOuts: shouldExportOptOuts
  } = spokeOptions;

  const {
    fileNameKey,
    campaignId,
    campaignTitle,
    contactsCount,
    helpers,
    interactionSteps,
    campaignVariableNames
  } = campaignData;

  const campaignExportUrl = shouldExportCampaign
    ? await processAndUploadCampaignContacts({
        fileNameKey,
        campaignId,
        campaignTitle,
        contactsCount,
        helpers,
        interactionSteps,
        onlyOptOuts: false
      })
    : null;

  const campaignOptOutsExportUrl = shouldExportOptOuts
    ? await processAndUploadCampaignContacts({
        fileNameKey,
        campaignId,
        campaignTitle,
        contactsCount,
        helpers,
        interactionSteps,
        onlyOptOuts: true
      })
    : null;

  const campaignMessagesExportUrl = shouldExportMessages
    ? await processAndUploadCampaignMessages({
        fileNameKey,
        campaignId,
        contactsCount,
        helpers,
        campaignVariableNames
      })
    : null;

  const campaignFilteredContactsExportUrl = shouldExportFilteredContacts
    ? await processAndUploadFilteredContacts({
        fileNameKey,
        campaignId,
        campaignTitle,
        helpers
      })
    : null;

  return {
    campaignExportUrl,
    campaignFilteredContactsExportUrl,
    campaignOptOutsExportUrl,
    campaignMessagesExportUrl
  };
};

export interface ExportCampaignPayload {
  campaignId: number;
  requesterId: number;
  isAutomatedExport?: boolean;
  spokeOptions: SpokeOptions;
}

export const exportCampaign: ProgressTask<ExportCampaignPayload> = async (
  payload,
  helpers
) => {
  const {
    campaignId,
    requesterId,
    isAutomatedExport = false,
    spokeOptions
  } = payload;
  const {
    campaignTitle,
    notificationEmail,
    interactionSteps,
    campaignVariableNames
  } = await fetchExportData(campaignId, requesterId);

  const countQueryResult = await r
    .reader("campaign_contact")
    .count("*")
    .where({ campaign_id: campaignId });
  const contactsCount = countQueryResult[0].count as number;

  // Attempt upload to cloud storage
  let fileNameKey = campaignTitle.replace(/ /g, "_").replace(/\//g, "_");

  if (!isAutomatedExport) {
    const timestamp = DateTime.local().toFormat("y-mm-d-hh-mm-ss");
    fileNameKey = `${fileNameKey}-${timestamp}`;
  }

  const campaignData = {
    fileNameKey,
    campaignId,
    campaignTitle,
    contactsCount,
    helpers,
    interactionSteps,
    campaignVariableNames
  };

  const {
    campaignExportUrl,
    campaignFilteredContactsExportUrl,
    campaignOptOutsExportUrl,
    campaignMessagesExportUrl
  } = await processExportData(campaignData, spokeOptions);

  helpers.logger.debug("Waiting for streams to finish");

  try {
    if (!isAutomatedExport) {
      const exportContent = await getExportCampaignContent(
        {
          campaignExportUrl,
          campaignFilteredContactsExportUrl,
          campaignOptOutsExportUrl,
          campaignMessagesExportUrl
        },
        campaignTitle
      );
      await sendEmail({
        to: notificationEmail,
        subject: `Export ready for ${campaignTitle}`,
        html: exportContent
      });
    }
    helpers.logger.info(`Successfully exported ${campaignId}`);
  } finally {
    helpers.logger.info("Finishing export process");
  }
};

export const addExportCampaign = async (payload: ExportCampaignPayload) =>
  addProgressJob({
    identifier: TASK_IDENTIFIER,
    payload,
    taskSpec: {
      queueName: "export"
    }
  });
