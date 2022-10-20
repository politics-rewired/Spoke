import { PhoneNumberFormat, PhoneNumberUtil } from "google-libphonenumber";
import type { JobHelpers } from "graphile-worker";

import type {
  VanAuthPayload,
  VanSecretAuthPayload
} from "../../external-systems/van";
import { getSecret } from "../../lib/graphile-secrets";

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

export const getVanAuth = async (
  helpers: JobHelpers,
  payload: VanSecretAuthPayload
): Promise<VanAuthPayload> => {
  const {
    username,
    api_key: { __secret: apiKeyRef }
  } = payload;

  const apiKey = await helpers.withPgClient((client) =>
    getSecret(client, apiKeyRef)
  );

  return { username, api_key: apiKey! };
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
