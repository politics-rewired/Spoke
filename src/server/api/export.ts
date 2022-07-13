import { getContent } from "../lib/templates/export";
import { r } from "../models";

const getExportContent = async (
  exportUrls: { [key: string]: any },
  campaignTitle: string,
  campaignId: number
) => {
  const organizationName = await r
    .knex("organization")
    .join("campaign", "campaign.organization_id", "organization.id")
    .where({ "campaign.id": campaignId })
    .first("name");

  return getContent(exportUrls, campaignTitle, organizationName.name);
};

export default getExportContent;
