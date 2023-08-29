import type { CampaignExportMetaData } from "../lib/templates/export-multiple-campaigns";
import getEmailContent from "../lib/templates/export-multiple-campaigns";

const formatMultipleCampaignExportsEmail = (
  campaignExportMetaData: CampaignExportMetaData
) => {
  return getEmailContent(campaignExportMetaData);
};

export default formatMultipleCampaignExportsEmail;
