import { sqlResolvers } from "./lib/utils";

export const resolvers = {
  CampaignIdAssignmentId: {
    ...sqlResolvers(["campaignId", "assignmentId"])
  }
};
