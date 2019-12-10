import { sqlResolvers } from "./lib/utils";
import { CannedResponse } from "../models";

export const resolvers = {
  CannedResponse: {
    ...sqlResolvers(["id", "title", "text"]),
    isUserCreated: cannedResponse => cannedResponse.user_id !== ""
  }
};

CannedResponse.ensureIndex("campaign_id");
