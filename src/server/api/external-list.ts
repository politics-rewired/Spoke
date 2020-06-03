import { sqlResolvers } from "./lib/utils";

export const resolvers = {
  ExternalList: {
    ...sqlResolvers([
      "name",
      "description",
      "listCount",
      "doorCount",
      "systemId",
      "externalId",
      "createdAt",
      "updatedAt"
    ])
  }
};
