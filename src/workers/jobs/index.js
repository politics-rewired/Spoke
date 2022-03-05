import AWS from "aws-sdk";
import _ from "lodash";
import zipCodeToTimeZone from "zipcode-to-timezone";

import { config } from "../../config";
import { gunzip } from "../../lib";
import { getFormattedPhoneNumber } from "../../lib/phone-format";
import { isValidTimezone } from "../../lib/tz-helpers";
import logger from "../../logger";
import {
  assignMissingMessagingServices,
  // eslint-disable-next-line import/named
  getLastMessage,
  saveNewIncomingMessage
} from "../../server/api/lib/message-sending";
import serviceMap from "../../server/api/lib/services";
import { cacheableData, datawarehouse, r } from "../../server/models";
import { errToObj } from "../../server/utils";
import { updateJob } from "../lib";

const CHUNK_SIZE = 1000;
const BATCH_SIZE = Math.max(1, Math.floor(config.DB_MAX_POOL * 0.5));

let warehouseConnection = null;
function optOutsByOrgId(orgId) {
  return r.knex.select("cell").from("opt_out").where("organization_id", orgId);
}

function optOutsByInstance() {
  return r.knex.select("cell").from("opt_out");
}

function getOptOutSubQuery(orgId) {
  return config.OPTOUTS_SHARE_ALL_ORGS
    ? optOutsByInstance()
    : optOutsByOrgId(orgId);
}

export async function sendJobToAWSLambda(job) {
  // job needs to be json-serializable
  // requires a 'command' key which should map to a function in job-processes.js
  logger.info(
    "LAMBDA INVOCATION STARTING",
    job,
    config.AWS_LAMBDA_FUNCTION_NAME
  );

  if (!job.command) {
    logger.error("LAMBDA INVOCATION FAILED: JOB NOT INVOKABLE", job);
    return Promise.reject("Job type not available in job-processes");
  }
  const lambda = new AWS.Lambda();
  const lambdaPayload = JSON.stringify(job);
  if (lambdaPayload.length > 128000) {
    logger.error("LAMBDA INVOCATION FAILED PAYLOAD TOO LARGE");
    return Promise.reject("Payload too large");
  }

  const p = new Promise((resolve, reject) => {
    const result = lambda.invoke(
      {
        FunctionName: config.AWS_LAMBDA_FUNCTION_NAME,
        InvocationType: "Event",
        Payload: lambdaPayload
      },
      (err, data) => {
        if (err) {
          logger.error("LAMBDA INVOCATION FAILED", err, job);
          reject(err);
        } else {
          resolve(data);
        }
      }
    );
    logger.info("LAMBDA INVOCATION RESULT", result);
  });
  return p;
}

export async function processSqsMessages() {
  // hit endpoint on SQS
  // ask for a list of messages from SQS (with quantity tied to it)
  // if SQS has messages, process messages into pending_message_part and dequeue messages (mark them as handled)
  // if SQS doesnt have messages, exit

  if (!config.TWILIO_SQS_QUEUE_URL) {
    return Promise.reject("TWILIO_SQS_QUEUE_URL not set");
  }

  const sqs = new AWS.SQS();

  const params = {
    QueueUrl: config.TWILIO_SQS_QUEUE_URL,
    AttributeNames: ["All"],
    MessageAttributeNames: ["string"],
    MaxNumberOfMessages: 10,
    VisibilityTimeout: 60,
    WaitTimeSeconds: 10,
    ReceiveRequestAttemptId: "string"
  };

  const p = new Promise((resolve, reject) => {
    sqs.receiveMessage(params, async (err, data) => {
      if (err) {
        logger.error("Error receiving SQS message: ", {
          ...errToObj(err)
        });
        reject(err);
      } else if (data.Messages) {
        logger.info(data);
        for (let i = 0; i < data.Messages.length; i += 1) {
          const message = data.Messages[i];
          const body = message.Body;
          logger.info("processing sqs queue:", body);
          const twilioMessage = JSON.parse(body);

          await serviceMap.twilio.handleIncomingMessage(twilioMessage);

          sqs.deleteMessage(
            {
              QueueUrl: config.TWILIO_SQS_QUEUE_URL,
              ReceiptHandle: message.ReceiptHandle
            },
            (delMessageErr, delMessageData) => {
              if (delMessageErr) {
                logger.error("Error deleting SQS message: ", {
                  ...errToObj(delMessageErr)
                }); // an error occurred
              } else {
                logger.info(delMessageData); // successful response
              }
            }
          );
        }
        resolve();
      }
    });
  });
  return p;
}

export async function uploadContacts(job) {
  const campaignId = job.campaign_id;
  // We do this deletion in schema.js but we do it again here just in case the the queue broke and we had a backlog of
  // contact uploads for one campaign
  const campaign = await r.knex("campaign").where({ id: campaignId }).first();

  const organization = await r
    .knex("organization")
    .where({ id: campaign.organization_id })
    .first();

  const orgFeatures = JSON.parse(organization.features || "{}");

  await Promise.all([
    r.knex("campaign_contact").where({ campaign_id: campaignId }).del(),
    r
      .knex("campaign")
      .update({ landlines_filtered: false })
      .where({ id: campaignId })
  ]);

  let jobPayload = await gunzip(Buffer.from(job.payload, "base64"));
  jobPayload = JSON.parse(jobPayload);
  const { validationStats } = jobPayload;
  const excludeCampaignIds = (jobPayload.excludeCampaignIds ?? []).map((id) =>
    parseInt(id, 10)
  );
  let { contacts } = jobPayload;

  const maxContacts = parseInt(
    Object.prototype.hasOwnProperty.call(orgFeatures, "maxContacts")
      ? orgFeatures.maxContacts
      : config.MAX_CONTACTS,
    10
  );

  if (maxContacts) {
    // note: maxContacts == 0 means no maximum
    contacts = contacts.slice(0, maxContacts);
  }

  for (let index = 0; index < contacts.length; index += 1) {
    const datum = contacts[index];
    if (datum.zip) {
      // using memoization and large ranges of homogenous zips
      datum.timezone = zipCodeToTimeZone.lookup(datum.zip);
    }
  }

  const jobMessages = await r.knex.transaction(async (trx) => {
    const resultMessages = [];

    const contactChunks = _.chunk(contacts, CHUNK_SIZE);
    const chunkChunks = _.chunk(contactChunks, BATCH_SIZE);
    let chunksCompleted = 0;

    for (const chunkChunk of chunkChunks) {
      await Promise.all(
        // eslint-disable-next-line no-loop-func
        chunkChunk.map(async (chunk) => {
          const percentComplete = Math.round(
            (chunksCompleted / contactChunks.length) * 100
          );

          try {
            await trx("campaign_contact").insert(chunk);
          } catch (exc) {
            logger.error("Error inserting contacts: ", exc);
            throw exc;
          }

          chunksCompleted += 1;
          await updateJob(job, percentComplete);
        })
      );

      await assignMissingMessagingServices(
        trx,
        campaignId,
        campaign.organization_id
      );
    }

    try {
      const deleteOptOutCells = await trx("campaign_contact")
        .whereIn("cell", getOptOutSubQuery(campaign.organization_id))
        .where("campaign_id", campaignId)
        .delete();

      if (deleteOptOutCells) {
        resultMessages.push(
          `Number of contacts excluded due to their opt-out status: ${deleteOptOutCells}`
        );
      }

      const {
        dupeCount = 0,
        missingCellCount = 0,
        invalidCellCount = 0,
        zipCount = 0
      } = validationStats;

      if (dupeCount) {
        resultMessages.push(
          `Number of duplicate contacts removed: ${dupeCount}`
        );
      }
      if (missingCellCount) {
        resultMessages.push(
          `Number of contacts excluded due to missing cells: ${missingCellCount}`
        );
      }
      if (invalidCellCount) {
        resultMessages.push(
          `Number of contacts with excluded due to invalid cells: ${invalidCellCount}`
        );
      }
      if (zipCount) {
        resultMessages.push(
          `Number of contacts with valid zip codes: ${zipCount}`
        );
      }
    } catch (exc) {
      logger.error("Error deleting opt-outs: ", exc);
      throw exc;
    }

    const whereInParams = excludeCampaignIds.map((_cid) => "?").join(", ");
    try {
      const { rowCount: exclusionCellCount } =
        excludeCampaignIds.length === 0
          ? { rowCount: 0 }
          : await trx.raw(
              `
                with exclude_cell as (
                  select distinct on (campaign_contact.cell)
                    campaign_contact.cell
                  from
                    campaign_contact
                  where
                    campaign_contact.campaign_id in (${whereInParams})
                )
                delete from
                  campaign_contact
                where
                  campaign_contact.campaign_id = ?
                  and exists (
                    select 1
                    from exclude_cell
                    where exclude_cell.cell = campaign_contact.cell
                  )
                ;
              `,
              excludeCampaignIds.concat([campaignId])
            );

      if (exclusionCellCount) {
        resultMessages.push(
          `Number of contacts excluded due to campaign exclusion list: ${exclusionCellCount}`
        );
      }
    } catch (exc) {
      logger.error("Error deleting excluded contacts: ", exc);
      throw exc;
    }

    return resultMessages;
  });

  if (job.id) {
    // Always set a result message to mark the job as complete
    const message =
      jobMessages.length > 0
        ? jobMessages.join("\n")
        : "Contact upload successful.";
    await r
      .knex("job_request")
      .where("id", job.id)
      .update({ result_message: message });
  }

  await cacheableData.campaign.reload(campaignId);
}

export async function loadContactsFromDataWarehouseFragment(jobEvent) {
  const jobMessages = [];
  logger.info(
    "starting loadContactsFromDataWarehouseFragment",
    jobEvent.campaignId,
    jobEvent.limit,
    jobEvent.offset,
    jobEvent
  );
  const jobCompleted = await r
    .reader("job_request")
    .where("id", jobEvent.jobId)
    .select("status")
    .first();
  if (!jobCompleted) {
    logger.error("loadContactsFromDataWarehouseFragment job no longer exists", {
      campaignId: jobEvent.campaignId,
      jobCompleted,
      jobEvent
    });
    return { alreadyComplete: 1 };
  }

  let sqlQuery = jobEvent.query;
  if (jobEvent.limit) {
    sqlQuery += ` LIMIT ${jobEvent.limit}`;
  }
  if (jobEvent.offset) {
    sqlQuery += ` OFFSET ${jobEvent.offset}`;
  }
  let knexResult;
  try {
    warehouseConnection = warehouseConnection || datawarehouse();
    logger.error(
      "loadContactsFromDataWarehouseFragment RUNNING WAREHOUSE query",
      { sqlQuery }
    );
    knexResult = await warehouseConnection.raw(sqlQuery);
  } catch (err) {
    // query failed
    logger.error("Data warehouse query failed: ", { ...errToObj(err) });
    jobMessages.push(`Data warehouse count query failed with ${err}`);
    // TODO: send feedback about job
  }
  const fields = {};
  const customFields = {};
  const contactFields = {
    first_name: 1,
    last_name: 1,
    cell: 1,
    zip: 1,
    external_id: 1
  };
  knexResult.fields.forEach((f) => {
    fields[f.name] = 1;
    if (!(f.name in contactFields)) {
      customFields[f.name] = 1;
    }
  });
  if (!("first_name" in fields && "last_name" in fields && "cell" in fields)) {
    logger.error(
      "SQL statement does not return first_name, last_name, and cell",
      {
        sqlQuery,
        fields
      }
    );
    jobMessages.push(
      `SQL statement does not return first_name, last_name and cell => ${sqlQuery} => with fields ${fields}`
    );
    return;
  }

  const savePortion = await Promise.all(
    knexResult.rows.map(async (row) => {
      const formatCell = getFormattedPhoneNumber(
        row.cell,
        config.PHONE_NUMBER_COUNTRY
      );
      const contact = {
        campaign_id: jobEvent.campaignId,
        first_name: row.first_name || "",
        last_name: row.last_name || "",
        cell: formatCell,
        zip: row.zip || "",
        external_id: row.external_id ? String(row.external_id) : "",
        assignment_id: null,
        message_status: "needsMessage"
      };
      const contactCustomFields = {};
      Object.keys(customFields).forEach((f) => {
        contactCustomFields[f] = row[f];
      });
      contact.custom_fields = JSON.stringify(contactCustomFields);
      if (
        contact.zip &&
        !Object.prototype.hasOwnProperty.call(
          // eslint-disable-next-line no-undef
          foocontactCustomFields,
          "timezone"
        )
      ) {
        contact.timezone = zipCodeToTimeZone.lookup(contact.zip);
      }

      if ("timezone" in contactCustomFields) {
        contact.timezone = isValidTimezone(contactCustomFields.timezone)
          ? contactCustomFields.timezone
          : zipCodeToTimeZone.lookup(contact.zip);
      }

      return contact;
    })
  );

  await r.knex.batchInsert("campaign_contact", savePortion, 1000);
  await r
    .knex("job_request")
    .where("id", jobEvent.jobId)
    .increment("status", 1);
  const validationStats = {};

  const completed = await r
    .reader("job_request")
    .where("id", jobEvent.jobId)
    .select("status")
    .first();

  if (!completed) {
    logger.error("loadContactsFromDataWarehouseFragment job has been deleted", {
      completed,
      campaignId: jobEvent.campaignId
    });
  } else if (jobEvent.totalParts && completed.status >= jobEvent.totalParts) {
    if (jobEvent.organizationId) {
      // now that we've saved them all, we delete everyone that is opted out locally
      // doing this in one go so that we can get the DB to do the indexed cell matching

      // delete optout cells
      await r
        .knex("campaign_contact")
        .whereIn("cell", getOptOutSubQuery(jobEvent.organizationId))
        .where("campaign_id", jobEvent.campaignId)
        .delete()
        .then((result) => {
          logger.error(
            "loadContactsFromDataWarehouseFragment # of contacts opted out removed from DW query",
            {
              campaignId: jobEvent.campaignId,
              result
            }
          );
          validationStats.optOutCount = result;
        });

      // delete invalid cells
      await r
        .knex("campaign_contact")
        .whereRaw("length(cell) != 12")
        .andWhere("campaign_id", jobEvent.campaignId)
        .delete()
        .then((result) => {
          logger.error(
            "loadContactsFromDataWarehouseFragment # of contacts with invalid cells removed from DW query",
            {
              campaignId: jobEvent.campaignId,
              result
            }
          );
          validationStats.invalidCellCount = result;
        });

      // delete duplicate cells
      await r
        .knex("campaign_contact")
        .whereIn(
          "id",
          r
            .knex("campaign_contact")
            .select("campaign_contact.id")
            .leftJoin("campaign_contact AS c2", function joinSelf() {
              this.on("c2.campaign_id", "=", "campaign_contact.campaign_id")
                .andOn("c2.cell", "=", "campaign_contact.cell")
                .andOn("c2.id", ">", "campaign_contact.id");
            })
            .where("campaign_contact.campaign_id", jobEvent.campaignId)
            .whereNotNull("c2.id")
        )
        .delete()
        .then((result) => {
          logger.error(
            "loadContactsFromDataWarehouseFragment # of contacts with duplicate cells removed from DW query",
            {
              campaignId: jobEvent.campaignId,
              result
            }
          );
          validationStats.duplicateCellCount = result;
        });
    }
    await r.knex("job_request").where({ id: jobEvent.jobId }).del();
    await cacheableData.campaign.reload(jobEvent.campaignId);
    return { completed: 1, validationStats };
  } else if (jobEvent.part < jobEvent.totalParts - 1) {
    const newPart = jobEvent.part + 1;
    const newJob = {
      ...jobEvent,
      part: newPart,
      offset: newPart * jobEvent.step,
      limit: jobEvent.step,
      command: "loadContactsFromDataWarehouseFragmentJob"
    };
    if (config.WAREHOUSE_DB_LAMBDA_ITERATION) {
      logger.info(
        "SENDING TO LAMBDA loadContactsFromDataWarehouseFragment",
        newJob
      );
      await sendJobToAWSLambda(newJob);
      return { invokedAgain: 1 };
    }
    return loadContactsFromDataWarehouseFragment(newJob);
  }
}

export async function loadContactsFromDataWarehouse(job) {
  logger.info("STARTING loadContactsFromDataWarehouse", job.payload);
  const jobMessages = [];
  const sqlQuery = job.payload;

  if (!sqlQuery.startsWith("SELECT") || sqlQuery.indexOf(";") >= 0) {
    logger.error(
      "Malformed SQL statement.  Must begin with SELECT and not have any semicolons",
      { sqlQuery }
    );
    return;
  }
  if (!datawarehouse) {
    logger.error("No data warehouse connection, so cannot load contacts", {
      job
    });
    return;
  }

  let knexCountRes;
  let knexCount;
  try {
    warehouseConnection = warehouseConnection || datawarehouse();
    knexCountRes = await warehouseConnection.raw(
      `SELECT COUNT(*) FROM ( ${sqlQuery} ) AS QUERYCOUNT`
    );
  } catch (err) {
    logger.error("Data warehouse count query failed: ", err);
    jobMessages.push(`Data warehouse count query failed with ${err}`);
  }

  if (knexCountRes) {
    knexCount = knexCountRes.rows[0].count;
    if (!knexCount || knexCount === 0) {
      jobMessages.push("Error: Data warehouse query returned zero results");
    }
  }

  const STEP =
    r.kninky && r.kninky.defaultsUnsupported
      ? 10 // sqlite has a max of 100 variables and ~8 or so are used per insert
      : 10000; // default
  const campaign = await r
    .knex("campaign")
    .where({ id: job.campaign_id })
    .first();
  const totalParts = Math.ceil(knexCount / STEP);

  if (totalParts > 1 && /LIMIT/.test(sqlQuery)) {
    // We do naive string concatenation when we divide queries up for parts
    // just appending " LIMIT " and " OFFSET " arguments.
    // If there is already a LIMIT in the query then we'll be unable to do that
    // so we error out.  Note that if the total is < 10000, then LIMIT will be respected
    jobMessages.push(
      `Error: LIMIT in query not supported for results larger than ${STEP}. Count was ${knexCount}`
    );
  }

  if (job.id && jobMessages.length) {
    const resultMessages = await r
      .knex("job_request")
      .where("id", job.id)
      .update({ result_message: jobMessages.join("\n") });
    return resultMessages;
  }

  await r
    .knex("campaign_contact")
    .where("campaign_id", job.campaign_id)
    .delete();

  await loadContactsFromDataWarehouseFragment({
    jobId: job.id,
    query: sqlQuery,
    campaignId: job.campaign_id,
    jobMessages,
    // beyond job object:
    organizationId: campaign.organization_id,
    totalParts,
    totalCount: knexCount,
    step: STEP,
    part: 0,
    limit: totalParts > 1 ? STEP : 0 // 0 is unlimited
  });
}

export const deleteJob = async (jobId, retries = 0) => {
  try {
    await r.knex("job_request").where({ id: jobId }).del();
  } catch (err) {
    if (retries < 5) {
      await deleteJob(jobId, retries + 1);
    } else {
      logger.error("Could not delete job. Err: ", err);
    }
  }
};

// add an in-memory guard that the same messages are being sent again and again
// not related to stale filter
let pastMessages = [];

export async function sendMessages(queryFunc, defaultStatus) {
  try {
    await r.knex.transaction(async (trx) => {
      let messages = [];
      try {
        let messageQuery = trx("message")
          .forUpdate()
          .where({ send_status: defaultStatus || "QUEUED" });

        if (queryFunc) {
          messageQuery = queryFunc(messageQuery);
        }

        messages = await messageQuery.orderBy("created_at");
      } catch (err) {
        // Unable to obtain lock on these rows meaning another process must be
        // sending them. We will exit gracefully in that case.
        trx.rollback();
        return;
      }

      try {
        for (let index = 0; index < messages.length; index += 1) {
          const message = messages[index];
          if (pastMessages.indexOf(message.id) !== -1) {
            throw new Error(
              `${
                "Encountered send message request of the same message." +
                " This is scary!  If ok, just restart process. Message ID: "
              }${message.id}`
            );
          }
          message.service = message.service || config.DEFAULT_SERVICE;
          const service = serviceMap[message.service];
          logger.info(
            `Sending (${message.service}): ${message.user_number} -> ${message.contact_number}\nMessage: ${message.text}`
          );
          await service.sendMessage(message, trx);
          pastMessages.push(message.id);
          pastMessages = pastMessages.slice(-100); // keep the last 100
        }

        trx.commit();
      } catch (err) {
        logger.error("Error in sendMessages: ", err);
        trx.rollback();
      }
    });
  } catch (err) {
    logger.error("sendMessages transaction errored: ", err);
  }
}

export async function handleIncomingMessageParts() {
  const messageParts = await r
    .reader("pending_message_part")
    .select("*")
    .limit(100);
  const messagePartsByService = {};
  messageParts.forEach((m) => {
    if (m.service in serviceMap) {
      if (!(m.service in messagePartsByService)) {
        messagePartsByService[m.service] = [];
      }
      messagePartsByService[m.service].push(m);
    }
  });
  for (const serviceKey in messagePartsByService) {
    let allParts = messagePartsByService[serviceKey];
    const service = serviceMap[serviceKey];
    if (service.syncMessagePartProcessing) {
      // filter for anything older than ten minutes ago
      const tenMinutesAgo = new Date(new Date() - 1000 * 60 * 10);
      allParts = allParts.filter((part) => part.created_at < tenMinutesAgo);
    }
    const allPartsCount = allParts.length;
    if (allPartsCount === 0) {
      continue;
    }

    const convertMessageParts = service.convertMessagePartsToMessage;
    const messagesToSave = [];
    let messagePartsToDelete = [];
    const concatMessageParts = {};
    for (let i = 0; i < allPartsCount; i += 1) {
      const part = allParts[i];
      const serviceMessageId = part.service_id;
      const savedCount = await r.parseCount(
        r.reader("message").where({ service_id: serviceMessageId }).count()
      );
      const lastMessage = await getLastMessage({
        contactNumber: part.contact_number,
        service: serviceKey
      });
      const duplicateMessageToSaveExists = !!messagesToSave.find(
        (message) => message.service_id === serviceMessageId
      );
      if (!lastMessage) {
        logger.info("Received message part with no thread to attach to", part);
        messagePartsToDelete.push(part);
      } else if (savedCount > 0) {
        logger.info(
          `Found already saved message matching part service message ID ${part.service_id}`
        );
        messagePartsToDelete.push(part);
      } else if (duplicateMessageToSaveExists) {
        logger.info(
          `Found duplicate message to be saved matching part service message ID ${part.service_id}`
        );
        messagePartsToDelete.push(part);
      } else {
        const parentId = part.parent_id;
        if (!parentId) {
          messagesToSave.push(await convertMessageParts([part]));
          messagePartsToDelete.push(part);
        } else {
          if (part.service !== "nexmo") {
            throw new Error("should not have a parent ID for twilio");
          }
          const groupKey = [parentId, part.contact_number, part.user_number];
          const serviceMessage = JSON.parse(part.service_message);
          if (
            !Object.prototype.hasOwnProperty.call(concatMessageParts.groupKey)
          ) {
            const partCount = parseInt(serviceMessage["concat-total"], 10);
            concatMessageParts[groupKey] = Array(partCount).fill(null);
          }

          const partIndex = parseInt(serviceMessage["concat-part"], 10) - 1;
          if (concatMessageParts[groupKey][partIndex] !== null) {
            messagePartsToDelete.push(part);
          } else {
            concatMessageParts[groupKey][partIndex] = part;
          }
        }
      }
    }
    const keys = Object.keys(concatMessageParts);
    const keyCount = keys.length;

    for (let i = 0; i < keyCount; i += 1) {
      const groupKey = keys[i];
      const keysMessageParts = concatMessageParts[groupKey];

      if (keysMessageParts.filter((part) => part === null).length === 0) {
        messagePartsToDelete = messagePartsToDelete.concat(keysMessageParts);
        const message = await convertMessageParts(keysMessageParts);
        messagesToSave.push(message);
      }
    }

    const messageCount = messagesToSave.length;
    for (let i = 0; i < messageCount; i += 1) {
      logger.info(
        "Saving message with service message ID",
        messagesToSave[i].service_id
      );
      await saveNewIncomingMessage(messagesToSave[i]);
    }

    const messageIdsToDelete = messagePartsToDelete.map((m) => m.id);
    logger.info("Deleting message parts", messageIdsToDelete);
    await r
      .knex("pending_message_part")
      .whereIn("id", messageIdsToDelete)
      .del();
  }
}

// Temporary fix for orgless users
// See https://github.com/MoveOnOrg/Spoke/issues/934
// and job-processes.js
export async function fixOrgless() {
  if (config.FIX_ORGLESS) {
    const orgless = await r.knex
      .select("user.id")
      .from("user")
      .leftJoin("user_organization", "user.id", "user_organization.user_id")
      .whereNull("user_organization.id");
    orgless.forEach(async (orglessUser) => {
      try {
        await r.knex.insert({
          user_id: orglessUser.id.toString(),
          organization_id: config.DEFAULT_ORG,
          role: "TEXTER"
        });
        logger.info(
          `added orgless user ${orglessUser.id} to organization ${config.DEFAULT_ORG}`
        );
      } catch (err) {
        logger.error("error on userOrganization save in orgless: ", err);
      }
    }); // forEach
  } // if
} // function

export async function clearOldJobs(delay) {
  // to clear out old stuck jobs
  const twoHoursAgo = new Date(new Date() - 1000 * 60 * 60 * 2);
  delay = delay || twoHoursAgo;
  return r
    .knex("job_request")
    .where({ assigned: true })
    .where("updated_at", "<", delay)
    .delete();
}
