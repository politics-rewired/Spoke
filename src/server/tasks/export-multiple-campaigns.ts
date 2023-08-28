import { TASK_IDENTIFIER } from "./export-campaign";
import { addProgressJob } from "./utils";

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

// add jobs for each campaign export to the job_requests table
export const addExportMultipleCampaigns = async (
  payload: ExportMultipleCampaignsPayload
) => {
  const { campaignIds, ...rest } = payload;
  const jobResults = [];
  for (const campaignId of campaignIds) {
    const innerPayload = { ...rest, campaignId };
    const result = await addProgressJob({
      identifier: TASK_IDENTIFIER,
      payload: innerPayload,
      taskSpec: {
        queueName: "multiple-campaign-exports"
      }
    });
    jobResults.push(result);
  }
  return jobResults;
};
