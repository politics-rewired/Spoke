import { Task } from "pg-compose";
import { get } from "superagent";

import {
  PaginatedVanResponse,
  VanAuthPayload,
  VANDataCollectionStatus,
  withVan
} from "../lib/external-systems";

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
  _helpers: any
) => {
  const limit = 50;
  let offset = 0;
  let returnCount = 0;
  let surveyQuestions: VANActivistCode[] = [];
  do {
    const response = await get("/activistCodes")
      .query({
        $top: limit,
        $skip: offset
      })
      .use(withVan(payload));
    const body: PaginatedVanResponse<VANActivistCode> = response.body;
    returnCount = body.items.length;
    offset += limit;
    surveyQuestions = surveyQuestions.concat(body.items);
  } while (returnCount > 0);

  return surveyQuestions.map(sq => ({
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
};

export default fetchVANActivistCodes;
