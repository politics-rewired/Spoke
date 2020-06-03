import { sqlResolvers } from "./lib/utils";
import { r } from "../models";

export enum ExternalSystemType {
  Van = "van"
}

interface ExternalSystem {
  id: string;
  organization_id: number;
  name: string;
  type: ExternalSystemType;
  api_key_ref: string;
}

export const resolvers = {
  ExternalSystem: {
    ...sqlResolvers([
      "id",
      "organizationId",
      "name",
      "createdAt",
      "updatedAt",
      "syncedAt"
    ]),
    type: (system: ExternalSystem) => system.type.toUpperCase(),
    apiKey: async (system: ExternalSystem) => system.api_key_ref,
    lists: async (system: ExternalSystem) =>
      r.reader("external_list").where({ system_id: system.id })
  }
};
