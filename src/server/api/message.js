import { sqlResolvers } from "./lib/utils";

export const resolvers = {
  Message: {
    ...sqlResolvers([
      "id",
      "campaignId",
      "userId",
      "text",
      "userNumber",
      "contactNumber",
      "isFromContact",
      "sendStatus",
      "createdAt"
    ])
  }
};

export default resolvers;
