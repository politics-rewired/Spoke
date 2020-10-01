import { sqlResolvers } from "./lib/utils";

export interface ExternalResultCode {
  id: string;
  system_id: string;
  external_id: number;
  name: string;
  medium_name: string;
  short_name: string;
  created_at: string;
  updated_at: string;
}

export const resolvers = {
  ExternalResultCode: {
    ...sqlResolvers([
      "id",
      "systemId",
      "externalId",
      "name",
      "mediumName",
      "shortName",
      "createdAt",
      "updatedAt"
    ])
  }
};
