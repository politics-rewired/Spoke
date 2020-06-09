import { sqlResolvers } from "./lib/utils";
import { formatPage } from "./lib/pagination";
import { r } from "../models";
import { RelayPageArgs } from "./types";

export enum ExternalSystemType {
  Van = "van"
}

interface ExternalSystem {
  id: string;
  organization_id: number;
  name: string;
  type: ExternalSystemType;
  username: string;
  api_key_ref: string;
}

export const resolvers = {
  ExternalSystem: {
    ...sqlResolvers([
      "id",
      "organizationId",
      "name",
      "username",
      "createdAt",
      "updatedAt",
      "syncedAt"
    ]),
    type: (system: ExternalSystem) => system.type.toUpperCase(),
    apiKey: async (system: ExternalSystem) => system.api_key_ref,
    lists: async (system: ExternalSystem, { after, first }: RelayPageArgs) => {
      const query = r.reader("external_list").where({ system_id: system.id });
      return formatPage(query, { after, first, primaryColumn: "created_at" });
    }
  }
};
