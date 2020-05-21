import { sqlResolvers } from "./lib/utils";
// import { r } from "../models";

// interface ExternalList {
//   system_id: string;
//   external_id: string;
//   name: string;
//   description: string;
//   list_count: number;
//   door_count: number;
// }

export const resolvers = {
  ExternalList: {
    ...sqlResolvers([
      "name",
      "description",
      "listCount",
      "doorCount",
      "systemId",
      "externalId"
    ])
  }
};
