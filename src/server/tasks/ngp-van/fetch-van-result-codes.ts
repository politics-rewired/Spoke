import type { JobHelpers, Task } from "graphile-worker";
import { get } from "superagent";

import type { VanSecretAuthPayload } from "../../lib/external-systems";
import { withVan } from "../../lib/external-systems";
import { getVanAuth, handleResult } from "./lib";

export const TASK_IDENTIFIER = "van-get-result-codes";

interface GetResultCodesPayload extends VanSecretAuthPayload {
  van_system_id: string;
}

export interface VANResultCode {
  resultCodeId: number;
  name: string;
  mediumName: string;
  shortName: string;
}

export const fetchVANResultCodes: Task = async (
  payload: GetResultCodesPayload,
  helpers: JobHelpers
) => {
  const auth = await getVanAuth(helpers, payload);

  // Result Codes are not paginated
  const response = await get("/canvassResponses/resultCodes").use(
    withVan(auth)
  );
  const resultCodes: VANResultCode[] = response.body;

  const result = resultCodes.map((sq) => ({
    van_system_id: payload.van_system_id,
    result_code_id: sq.resultCodeId,
    name: sq.name,
    medium_name: sq.mediumName,
    short_name: sq.shortName
  }));

  await handleResult(helpers, payload, result);
};

export default fetchVANResultCodes;
