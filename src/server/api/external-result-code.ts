import { sqlResolvers } from "./lib/utils";

export interface ExternalResultCode {
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
      "systemId",
      "externalId",
      "name",
      "mediumName",
      "shortName",
      "createdAt",
      "updatedAt"
    ]),
    id: (activistCode: ExternalResultCode) =>
      `${activistCode.system_id}|${activistCode.external_id}`
  }
};
