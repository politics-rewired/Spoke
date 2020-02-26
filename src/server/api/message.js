import { sqlResolvers } from "./lib/utils";
import { joinIdentifier } from "../lib/partition-id-helpers";

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
      return joinIdentifier(message.campaign_id, message.id);
    }
  }
};
