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
    apiKey: async (system: ExternalSystem) => {
      // Backwards compatibility for API keys added before organization ID was prepended
      const components = system.api_key_ref.split("|");
      return components.length === 1 ? components[0] : components[1];
    },
    lists: async (system: ExternalSystem, { after, first }: RelayPageArgs) => {
      const query = r.reader("external_list").where({ system_id: system.id });
      return formatPage(query, { after, first, primaryColumn: "created_at" });
    }
  }
};
