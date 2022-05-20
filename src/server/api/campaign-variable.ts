import { sqlResolvers } from "./lib/utils";
import { CampaignVariableRecord } from "./types";

export const resolvers = {
  CampaignVariable: {
    ...sqlResolvers(["id", "name", "value", "createdAt", "updatedAt"]),
    order: (campaignVariable: CampaignVariableRecord) =>
      campaignVariable.display_order
  }
};

export default resolvers;
