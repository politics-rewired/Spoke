import { mapFieldsToModel } from "./lib/utils";
import { Message } from "../models";

export const resolvers = {
  Message: {
    ...mapFieldsToModel(
      [
        "id",
        "text",
        "userNumber",
        "contactNumber",
        "isFromContact",
        "sendStatus",
        "createdAt"
      ],
      Message
    ),
    campaignId: instance => instance["campaign_id"],
    userId: instance => instance["user_id"]
  }
};
