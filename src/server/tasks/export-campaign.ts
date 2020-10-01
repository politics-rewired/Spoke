import { r } from "../../server/models";
import logger from "../../../src/logger";
import moment from "moment";
import { format } from "fast-csv";
import { getUploadStream, getDownloadUrl } from "../../workers/exports/upload";
import { sendEmail } from "../../server/mail";
import {
  fetchExportData,
  deleteJob,
  getUniqueQuestionsByStepId,
  processContactsChunk,
  processMessagesChunk
} from "../../workers/jobs";

const CHUNK_SIZE = 1000;

export const exportCampaign = async (payload: any, _helpers: any) => {
  const { campaign_id, job } = payload;

  let campaignId = undefined,
    campaignTitle = undefined,
    notificationEmail = undefined,
    interactionSteps = undefined,
    assignments = undefined,
    isAutomatedExport = undefined;

  try {
    ({
      campaignId,
      campaignTitle,
      notificationEmail,
      interactionSteps,
      assignments,
      isAutomatedExport
    } = await fetchExportData(job));
  } catch (exc) {
    logger.error("Error fetching export data: ", exc);
    return;
  }

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

  campaignContactsUploadStream.on("error", err => {
    logger.error("error in campaignContactsUploadStream: ", err);
  });
  campaignContactsWriteStream.on("error", err => {
    logger.error("error in campaignContactsWriteStream: ", err);
  });

  const campaignContactsUploadPromise = new Promise((resolve, reject) =>
    campaignContactsUploadStream.on("finish", resolve)
  );

  campaignContactsWriteStream.pipe(campaignContactsUploadStream);

  const messagesUploadStream = await getUploadStream(`${messagesKey}.csv`);
  const messagesWriteStream = format({
    headers: true,
    writeHeaders: true
  });

  messagesUploadStream.on("error", err => {
    logger.error("error in messagesUploadStream: ", err);
  });
  messagesWriteStream.on("error", err => {
    logger.error("error in messagesWriteStream: ", err);
  });

  const messagesUploadPromise = new Promise((resolve, reject) =>
    messagesUploadStream.on("finish", resolve)
  );

  messagesWriteStream.pipe(messagesUploadStream);

  // Message rows
  let lastContactId;
  let processed = 0;
  try {
    let chunkMessageResult = undefined;
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
        .where({ id: job.id })
        .update({
          status: Math.round((processed / contactsCount / 2) * 100)
        });
      for (const m of chunkMessageResult.messages) {
        messagesWriteStream.write(m);
      }
    }
  } catch (exc) {
    logger.error("Error building message rows: ", exc);
  }

  messagesWriteStream.end();

  // Contact rows
  try {
    let chunkContactResult = undefined;
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
        .where({ id: job.id })
        .update({
          status: Math.round((processed / contactsCount / 2) * 100) + 50
        });
      for (const c of chunkContactResult.contacts) {
        campaignContactsWriteStream.write(c);
      }
    }
  } catch (exc) {
    logger.error("Error building campaign contact rows: ", exc);
  }

  campaignContactsWriteStream.end();

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
      }).catch(err => {
        logger.error("Error sending export email: ", err);
        logger.info(`Campaign Export URL - ${campaignExportUrl}`);
        logger.info(
          `Campaign Messages Export URL - ${campaignMessagesExportUrl}`
        );
      });
    }
    logger.info(`Successfully exported ${campaignId}`);
  } catch (err) {
    logger.error("Error uploading export to cloud storage: ", err);

    await sendEmail({
      to: notificationEmail,
      subject: `Export failed for ${campaignTitle}`,
      text: `Your Spoke exports failed... please try again later.
        Error: ${err.message}`
    });
  }

  // Attempt to delete job ("why would a job ever _not_ have an id?" - bchrobot)
  if (job.id) {
    await deleteJob(job.id);
  } else {
    logger.debug(job);
  }
};

// export async function exportCampaign(job) {
//   let campaignId = undefined,
//     campaignTitle = undefined,
//     notificationEmail = undefined,
//     interactionSteps = undefined,
//     assignments = undefined,
//     isAutomatedExport = undefined;

//   try {
//     ({
//       campaignId,
//       campaignTitle,
//       notificationEmail,
//       interactionSteps,
//       assignments,
//       isAutomatedExport
//     } = await fetchExportData(job));
//   } catch (exc) {
//     logger.error("Error fetching export data: ", exc);
//     return;
//   }

//   const countQueryResult = await r
//     .reader("campaign_contact")
//     .count("*")
//     .where({ campaign_id: campaignId });
//   const contactsCount = countQueryResult[0].count;

//   const uniqueQuestionsByStepId = getUniqueQuestionsByStepId(interactionSteps);

//   // Attempt upload to cloud storage
//   let campaignContactsKey = campaignTitle
//     .replace(/ /g, "_")
//     .replace(/\//g, "_");

//   if (!isAutomatedExport) {
//     const timestamp = moment().format("YYYY-MM-DD-HH-mm-ss");
//     campaignContactsKey = `${campaignContactsKey}-${timestamp}`;
//   }
//   const messagesKey = `${campaignContactsKey}-messages`;

//   const campaignContactsUploadStream = await getUploadStream(
//     `${campaignContactsKey}.csv`
//   );
//   const campaignContactsWriteStream = format({
//     headers: true,
//     writeHeaders: true
//   });

//   campaignContactsUploadStream.on("error", err => {
//     logger.error("error in campaignContactsUploadStream: ", err);
//   });
//   campaignContactsWriteStream.on("error", err => {
//     logger.error("error in campaignContactsWriteStream: ", err);
//   });

//   const campaignContactsUploadPromise = new Promise((resolve, reject) =>
//     campaignContactsUploadStream.on("finish", resolve)
//   );

//   campaignContactsWriteStream.pipe(campaignContactsUploadStream);

//   const messagesUploadStream = await getUploadStream(`${messagesKey}.csv`);
//   const messagesWriteStream = format({ headers: true, writeHeaders: true });

//   messagesUploadStream.on("error", err => {
//     logger.error("error in messagesUploadStream: ", err);
//   });
//   messagesWriteStream.on("error", err => {
//     logger.error("error in messagesWriteStream: ", err);
//   });

//   const messagesUploadPromise = new Promise((resolve, reject) =>
//     messagesUploadStream.on("finish", resolve)
//   );

//   messagesWriteStream.pipe(messagesUploadStream);

//   // Message rows
//   let lastContactId;
//   let processed = 0;
//   try {
//     let chunkMessageResult = undefined;
//     lastContactId = 0;
//     while (
//       (chunkMessageResult = await processMessagesChunk(
//         campaignId,
//         lastContactId
//       ))
//     ) {
//       lastContactId = chunkMessageResult.lastContactId;
//       logger.debug(
//         `Processing message export for ${campaignId} chunk part ${lastContactId}`
//       );
//       processed += CHUNK_SIZE;
//       await r
//         .knex("job_request")
//         .where({ id: job.id })
//         .update({ status: Math.round((processed / contactsCount / 2) * 100) });
//       for (const m of chunkMessageResult.messages) {
//         messagesWriteStream.write(m);
//       }
//     }
//   } catch (exc) {
//     logger.error("Error building message rows: ", exc);
//   }

//   messagesWriteStream.end();

//   // Contact rows
//   try {
//     let chunkContactResult = undefined;
//     lastContactId = 0;
//     processed = 0;
//     while (
//       (chunkContactResult = await processContactsChunk(
//         campaignId,
//         campaignTitle,
//         uniqueQuestionsByStepId,
//         lastContactId
//       ))
//     ) {
//       lastContactId = chunkContactResult.lastContactId;
//       logger.debug(
//         `Processing contact export for ${campaignId} chunk part ${lastContactId}`
//       );
//       processed += CHUNK_SIZE;
//       await r
//         .knex("job_request")
//         .where({ id: job.id })
//         .update({
//           status: Math.round((processed / contactsCount / 2) * 100) + 50
//         });
//       for (const c of chunkContactResult.contacts) {
//         campaignContactsWriteStream.write(c);
//       }
//     }
//   } catch (exc) {
//     logger.error("Error building campaign contact rows: ", exc);
//   }

//   campaignContactsWriteStream.end();

//   logger.debug("Waiting for streams to finish");
//   await Promise.all([campaignContactsUploadPromise, messagesUploadPromise]);

//   try {
//     const [campaignExportUrl, campaignMessagesExportUrl] = await Promise.all([
//       getDownloadUrl(`${campaignContactsKey}.csv`),
//       getDownloadUrl(`${messagesKey}.csv`)
//     ]);
//     if (!isAutomatedExport) {
//       await sendEmail({
//         to: notificationEmail,
//         subject: `Export ready for ${campaignTitle}`,
//         text:
//           `Your Spoke exports are ready! These URLs will be valid for 24 hours.` +
//           `\n\nCampaign export:\n${campaignExportUrl}` +
//           `\n\nMessage export:\n${campaignMessagesExportUrl}`
//       }).catch(err => {
//         logger.error("Error sending export email: ", err);
//         logger.info(`Campaign Export URL - ${campaignExportUrl}`);
//         logger.info(
//           `Campaign Messages Export URL - ${campaignMessagesExportUrl}`
//         );
//       });
//     }
//     logger.info(`Successfully exported ${campaignId}`);
//   } catch (err) {
//     logger.error("Error uploading export to cloud storage: ", err);

//     await sendEmail({
//       to: notificationEmail,
//       subject: `Export failed for ${campaignTitle}`,
//       text: `Your Spoke exports failed... please try again later.
//         Error: ${err.message}`
//     });
//   }

//   // Attempt to delete job ("why would a job ever _not_ have an id?" - bchrobot)
//   if (job.id) {
//     await deleteJob(job.id);
//   } else {
//     logger.debug(job);
//   }
// }

export default exportCampaign;
