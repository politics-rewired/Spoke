import { sqlResolvers } from "./lib/utils";

export const resolvers = {
  Invite: {
    ...sqlResolvers(["id", "isValid", "hash"])
  }
};
