import type { Task } from "graphile-worker";
import { get } from "superagent";

import type { VANDataCollectionStatus } from "../../lib/external-systems";
import type { VanAuthPayload } from "./lib";
import { handleResult, withVan } from "./lib";

export const TASK_IDENTIFIER = "van-get-activist-codes";

interface GetActivistCodesPayload extends VanAuthPayload {
  van_system_id: string;
}

export interface VANActivistCode {
  activistCodeId: number;
  type: string;
  name: string;
  mediumName: string;
  shortName: string;
  description: string;
  scriptQuestion: string;
  status: VANDataCollectionStatus;
}

export const fetchVANActivistCodes: Task = async (
  payload: GetActivistCodesPayload,
  helpers
) => {
  const limit = 50;
  let offset = 0;
  let hasNextPage = false;
  let surveyQuestions: VANActivistCode[] = [];
  do {
    const response = await get("/activistCodes")
      .query({
        $top: limit,
        $skip: offset
      })
      .use(withVan(payload));
    const { body } = response;
    hasNextPage = body.nextPageLink !== null;
    offset += limit;
    surveyQuestions = surveyQuestions.concat(body.items);
  } while (hasNextPage);

  const result = surveyQuestions.map((sq) => ({
    van_system_id: payload.van_system_id,
    activist_code_id: sq.activistCodeId,
    type: sq.type,
    name: sq.name,
    medium_name: sq.mediumName,
    short_name: sq.shortName,
    description: sq.description,
    script_question: sq.scriptQuestion,
    status: sq.status.toLowerCase()
  }));

  await handleResult(helpers, payload, result);
};

export default fetchVANActivistCodes;
