import { SuperAgentRequest } from "superagent";

import { r } from "../models";
import { config } from "../../config";

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
  request.auth(van.username, `${van.api_key}|0`, { type: "basic" });
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
    ])
  ]);
