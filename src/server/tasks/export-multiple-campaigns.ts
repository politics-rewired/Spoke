import { DateTime } from "luxon";

import getExportCampaignContent from "../api/export-campaign";
import { r } from "../models";
import { fetchExportData, processExportData } from "./export-campaign";
import type { ProgressTask } from "./utils";
import { addProgressJob } from "./utils";

export const TASK_IDENTIFIER = "export-multiple-campaigns";

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
export const exportMultipleCampaigns: ProgressTask<ExportMultipleCampaignsPayload> = async (
  payload,
  helpers
) => {
  // multiple jobs in progress
  // handle exporting data
  // send one email for all exports

  const { campaignIds, requesterId, spokeOptions } = payload;
  const exportsContent = [];
  for (const campaignId of campaignIds) {
    const {
      campaignTitle,
      // TODO - see below
      notificationEmail: _email,
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

    const timestamp = DateTime.local().toFormat("y-mm-d-hh-mm-ss");
    fileNameKey = `${fileNameKey}-${timestamp}`;

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
      const exportContent = await getExportCampaignContent(
        {
          campaignExportUrl,
          campaignFilteredContactsExportUrl,
          campaignOptOutsExportUrl,
          campaignMessagesExportUrl
        },
        campaignTitle
      );
      exportsContent.push(exportContent);

      helpers.logger.info(`Successfully exported ${campaignId}`);
    } catch (e) {
      exportsContent.push(e);
    } finally {
      helpers.logger.info("Finishing individual export");
    }
  }
  // TODO - send one email with all export data
  // await sendEmail({
  //   to: notificationEmail,
  //   subject: `Export ready for ${campaignTitle}`,
  //   html: exportContent
  // });
  helpers.logger.info("Finishing export process");
};

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
        queueName: "campaign-exports"
      }
    });
    jobResults.push(result);
  }
  return jobResults;
};
