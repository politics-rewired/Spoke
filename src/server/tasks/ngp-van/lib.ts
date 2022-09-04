import { PhoneNumberFormat, PhoneNumberUtil } from "google-libphonenumber";
import type { JobHelpers } from "graphile-worker";
import type { SuperAgentRequest } from "superagent";

import { config } from "../../../config";
import cryptr from "../../lib/graphile-secrets";

export const TASK_IDENTIFIER = "van-get-saved-lists";

const DEFAULT_MODE = "0"; // VoterFile mode

export interface VanAuthPayload {
  username: string;
  api_key: string;
}

export interface PaginatedVanResponse<T> {
  items: T[];
  count: number;
  nextPageLink: string;
}

export const withVan = (van: VanAuthPayload) => (
  request: SuperAgentRequest
) => {
  const vanKey = cryptr.decrypt(van.api_key);
  const [apiKey, existingMode] = vanKey.split("|");
  const mode = existingMode ?? DEFAULT_MODE;
  request.auth(van.username, `${apiKey}|${mode}`, { type: "basic" });
  request.url = `${config.VAN_BASE_URL}${request.url}`;
  return request;
};

const phoneUtil = PhoneNumberUtil.getInstance();

export const normalizedPhoneOrNull = (number: string | null) => {
  if (typeof number !== "string") {
    return null;
  }

  try {
    return phoneUtil.format(
      phoneUtil.parse(number, "US"),
      PhoneNumberFormat.E164
    );
  } catch (ex) {
    return null;
  }
};

export const handleResult = async (
  helpers: JobHelpers,
  payload: any,
  result: any
) => {
  const { __after: afterFn, __context: context = {}, ...rest } = payload;

  if (afterFn) {
    await helpers.query(
      `select * from ${afterFn}($1::json, $2::json, $3::json)`,
      [JSON.stringify(rest), JSON.stringify(result), JSON.stringify(context)]
    );
  }
};
