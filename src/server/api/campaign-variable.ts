import { sqlResolvers } from "./lib/utils";

export const resolvers = {
  CampaignVariable: {
    ...sqlResolvers(["id", "name", "value", "createdAt", "updatedAt"])
  }
};

export default resolvers;
