import { sqlResolvers } from "./lib/utils";
// import { r } from "../models";

interface ExternalSystem {
  id: string;
  organization_id: number;
  name: string;
  type: string;
  api_key_ref: string;
}

export const resolvers = {
  ExternalSystem: {
    ...sqlResolvers(["id", "organization_id", "name", "type"]),
    apiKey: async (system: ExternalSystem) => system.api_key_ref
  }
};
