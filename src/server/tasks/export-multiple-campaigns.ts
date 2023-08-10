import DateTime from "../../lib/datetime";
import type { JobRequestRecord } from "../api/types";
import sendEmail from "../mail";
import { r } from "../models";
import type { ExportCampaignPayload } from "./export-campaign";
import { fetchExportData, processExportData } from "./export-campaign";
import type { ProgressTask } from "./utils";
import { addProgressJob } from "./utils";

export const EXPORT_TASK_IDENTIFIER = "bulk-export-campaigns";
export const EMAIL_TASK_IDENTIFIER = "email-export-campaigns";

export interface ExportMultipleCampaignsPayload {
  campaignIds: [number];
  requesterId: number;
  spokeOptions: {
    campaign: boolean;
    messages: boolean;
    optOuts: boolean;
    filteredContacts: boolean;
  };
}

// eslint-disable-next-line max-len
export const exportCampaignForBulkOperation: ProgressTask<ExportCampaignPayload> = async (
  payload,
  helpers
) => {
  const { campaignId, requesterId, spokeOptions } = payload;

  const {
    campaignTitle,
    interactionSteps,
    campaignVariableNames
  } = await fetchExportData(campaignId, requesterId);

  const [{ count }] = await r
    .reader("campaign_contact")
    .count("*")
    .where({ campaign_id: campaignId });
  const contactsCount = typeof count === "number" ? count : parseInt(count, 10);

  // Attempt upload to cloud storage
  const fileNameKey = campaignTitle.replace(/ /g, "_").replace(/\//g, "_");
  const timestamp = DateTime.local().toFormat("y-mm-d-hh-mm-ss");
  const keyWithTimeStamp = `${fileNameKey}-${timestamp}`;

  const campaignMetaData = {
    fileNameKey: keyWithTimeStamp,
    campaignId,
    campaignTitle,
    contactsCount,
    helpers,
    interactionSteps,
    campaignVariableNames
  };

  const exportUrls = await processExportData(campaignMetaData, spokeOptions);
  helpers.logger.info(`Successfully exported ${campaignId}`);

  // store exportUrls in job_request table
  await helpers.updateResult({ message: JSON.stringify(exportUrls) });
  // indicate that the exports have been processed
  await helpers.updateStatus(100);
};

type EmailBulkOperationPayload = ExportCampaignPayload & {
  jobRequestRecords: JobRequestRecord[];
  campaignIds: string[];
};

// eslint-disable-next-line max-len
export const sendEmailForBulkExportOperation: ProgressTask<EmailBulkOperationPayload> = async (
  payload,
  helpers
) => {
  const { jobRequestRecords, campaignId, requesterId, campaignIds } = payload;

  // map campaign id to campaign title and export urls for email composition
  const campaignMetaDataMap: Record<string, Record<string, unknown>> = {};
  for (const id of campaignIds) {
    const parsed = parseInt(id, 10);
    const { campaignTitle } = await fetchExportData(parsed, requesterId);
    campaignMetaDataMap[id] = { campaignTitle, exportUrls: null };
  }

  // query job_req table for campaign export urls where status is 100 (exports complete)
  const { rows } = await helpers.query(
    `
      select campaign_id, result_message 
      from job_request 
      where id = ANY ($1)
        and status = 100
    `,
    [jobRequestRecords.map((rec) => rec.id)]
  );

  // map query result to campaign id and parse JSON
  const campaignExportsMap = rows.map((result) => ({
    campaignId: result.campaign_id,
    exportUrls: JSON.parse(result.result_message)
  }));

  // map fetched export urls to  campaignMetaData
  for (const campaignExport of campaignExportsMap) {
    if (!Object.keys(campaignMetaDataMap).includes(campaignExport.campaignId)) {
      throw new Error("attempted to index metaData for incorrect campaign");
    }
    campaignMetaDataMap[campaignExport.campaignId].exportUrls =
      campaignExport.exportUrls;
  }

  try {
    const campaignIdsString = campaignIds.join(", ");
    // get email
    const { notificationEmail } = await fetchExportData(
      campaignId,
      requesterId
    );
    // TODO - format email content
    // trigger retry by throwing if export urls is null for a campaign?
    // const exporContent = await formatEmailContent
    await sendEmail({
      to: notificationEmail,
      subject: `Export(s) ready for campaign(s) ${campaignIdsString}`
      // html: exportContent
    });
    helpers.logger.info(
      `Successfully sent export details email for bulk operation`
    );
  } finally {
    // TODO - clean up job_request table
    helpers.logger.info("Finishing bulk export process");
  }
};

// add jobs for each campaign export to the job_requests table
export const addExportMultipleCampaigns = async (
  payload: ExportMultipleCampaignsPayload
) => {
  const { campaignIds, ...rest } = payload;
  const jobRequestRecords: JobRequestRecord[] = [];
  // dispatch individual progress job for each campaign export
  for (const campaignId of campaignIds) {
    const innerPayload = { ...rest, campaignId };
    const requestRecord = await addProgressJob({
      identifier: EXPORT_TASK_IDENTIFIER,
      payload: innerPayload,
      taskSpec: {
        queueName: "export-multiple-campaigns"
      }
    });

    jobRequestRecords.push(requestRecord);
  }

  console.log("requests", jobRequestRecords);
  const emailTaskPayload = {
    ...payload,
    campaignId: campaignIds[0],
    jobRequestRecords
  };
  // dispatch a single job to email export urls to client
  await addProgressJob({
    identifier: EMAIL_TASK_IDENTIFIER,
    payload: emailTaskPayload,
    taskSpec: {
      queueName: "send-email-after-bulk-export"
    }
  });
  return jobRequestRecords;
};

// desired flow:
// each export gets called as a job
// one email is sent after the exports are processed
