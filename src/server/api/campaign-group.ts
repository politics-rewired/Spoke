import { r } from "../models";
import { accessRequired } from "./errors";
import { formatPage } from "./lib/pagination";
import { sqlResolvers } from "./lib/utils";
import { RelayPageArgs } from "./types";

interface CampaignGroup {
  id: string;
  organization_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export const resolvers = {
  CampaignGroup: {
    ...sqlResolvers(["id", "name", "description", "createdAt", "updatedAt"]),
    campaigns: async (
      campaignGroup: CampaignGroup,
      { after, first }: RelayPageArgs,
      { user }: any
    ) => {
      const organizationId = parseInt(campaignGroup.id, 10);
      await accessRequired(user, organizationId, "ADMIN");

      const query = r
        .reader("campaign")
        .select("campaign.*")
        .join(
          "campaign_group_campaign",
          "campaign_group_campaign.campaign_id",
          "campaign.id"
        )
        .where({ campaign_group_id: campaignGroup.id });

      const result = await formatPage(query, {
        after,
        first,
        primaryColumn: "campaign.id"
      });
      return result;
    }
  }
};

export default resolvers;
