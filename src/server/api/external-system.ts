import { sqlResolvers } from "./lib/utils";
// import { r } from "../models";

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
    ...sqlResolvers(["id", "organizationId", "name", "type"]),
    apiKey: async (system: ExternalSystem) => system.api_key_ref
  }
};
