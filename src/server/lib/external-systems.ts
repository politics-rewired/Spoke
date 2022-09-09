import type { SuperAgentRequest } from "superagent";

import { config } from "../../config";
import { r } from "../models";

const DEFAULT_MODE = "0"; // VoterFile mode

export interface VanAuthPayload {
  username: string;
  api_key: string;
}

export enum VANDataCollectionStatus {
  Active = "Active",
  Archived = "Archived",
  Inactive = "Inactive"
}

export interface PaginatedVanResponse<T> {
  items: T[];
  count: number;
  nextPageLink: string;
}

export const withVan = (van: VanAuthPayload) => (
  request: SuperAgentRequest
) => {
  const [apiKey, existingMode] = van.api_key.split("|");
  const mode = existingMode || DEFAULT_MODE;
  request.auth(van.username, `${apiKey}|${mode}`, { type: "basic" });
  request.url = `${config.VAN_BASE_URL}${request.url}`;
  return request;
};

export const refreshExternalSystem = (systemId: string) =>
  Promise.all([
    r.knex.raw("select * from public.queue_refresh_saved_lists(?)", [systemId]),
    r.knex.raw("select * from public.queue_refresh_van_survey_questions(?)", [
      systemId
    ]),
    r.knex.raw("select * from public.queue_refresh_van_activist_codes(?)", [
      systemId
    ]),
    r.knex.raw("select * from public.queue_refresh_van_result_codes(?)", [
      systemId
    ])
  ]);
