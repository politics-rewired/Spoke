import DateTime from "../../lib/datetime";
import type { JobRequestRecord } from "../api/types";
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

  try {
    const exportUrls = await processExportData(campaignMetaData, spokeOptions);
    helpers.logger.debug("Waiting for streams to finish");

    // store exportUrls in job_request table
    await helpers.updateResult({ message: JSON.stringify(exportUrls) });
    // indicate that the exports have been processed
    await helpers.updateStatus(100);
  } finally {
    helpers.logger.info(
      `Successfully exported campaign ${campaignId} for bulk operation`
    );
  }
};

type EmailBulkOperationPayload = ExportCampaignPayload & {
  jobRequestRecords: JobRequestRecord[];
};

// eslint-disable-next-line max-len
export const sendEmailForBulkExportOperation: ProgressTask<EmailBulkOperationPayload> = async (
  payload,
  helpers
) => {
  console.log("HELLO", payload, "helpers", helpers);
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
  console.log("job results", jobRequestRecords);
  const emailTaskPayload = {
    ...rest,
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
