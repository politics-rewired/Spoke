import { sqlResolvers } from "./lib/utils";
import { ExternalDataCollectionStatus } from "./types";

export interface ExternalActivistCode {
  id: string;
  system_id: string;
  external_id: number;
  type: string;
  name: string;
  medium_name: string;
  short_name: string;
  description: string;
  script_question: string;
  status: ExternalDataCollectionStatus;
  created_at: string;
  updated_at: string;
}

export const resolvers = {
  ExternalActivistCode: {
    ...sqlResolvers([
      "id",
      "systemId",
      "externalId",
      "type",
      "name",
      "mediumName",
      "shortName",
      "description",
      "scriptQuestion",
      "createdAt",
      "updatedAt"
    ]),
    status: (activistCode: ExternalActivistCode) =>
      activistCode.status.toUpperCase()
  }
};
