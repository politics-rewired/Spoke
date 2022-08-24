import { getContent } from "../lib/templates/export-campaign";

const getExportCampaignContent = async (
  exportUrls: { [key: string]: any },
  campaignTitle: string
) => {
  return getContent(exportUrls, campaignTitle);
};

export default getExportCampaignContent;
