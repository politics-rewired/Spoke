import { Task } from "pg-compose";
import { get } from "superagent";

import { VanAuthPayload, withVan } from "../lib/external-systems";

interface GetResultCodesPayload extends VanAuthPayload {
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
  _helpers: any
) => {
  // Result Codes are not paginated
  const response = await get("/canvassResponses/resultCodes").use(
    withVan(payload)
  );
  const resultCodes: VANResultCode[] = response.body;

  return resultCodes.map(sq => ({
    van_system_id: payload.van_system_id,
    result_code_id: sq.resultCodeId,
    name: sq.name,
    medium_name: sq.mediumName,
    short_name: sq.shortName
  }));
};

export default fetchVANResultCodes;
