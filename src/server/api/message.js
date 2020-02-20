import { sqlResolvers } from "./lib/utils";

export const resolvers = {
  Message: {
    ...sqlResolvers([
      "campaignId",
      "campaignContactId",
      "userId",
      "text",
      "userNumber",
      "contactNumber",
      "isFromContact",
      "sendStatus",
      "createdAt"
    ]),
    id: async message => {
      return [message.campaign_id, message.id].join("|");
    }
  }
};
