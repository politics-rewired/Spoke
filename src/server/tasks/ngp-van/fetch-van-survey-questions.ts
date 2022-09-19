import type { JobHelpers, Task } from "graphile-worker";
import { get } from "superagent";

import type {
  VANDataCollectionStatus,
  VanSecretAuthPayload
} from "../../lib/external-systems";
import { withVan } from "../../lib/external-systems";
import { getVanAuth, handleResult } from "./lib";

export const TASK_IDENTIFIER = "van-get-survey-questions";

interface GetSurveyQuestionsPayload extends VanSecretAuthPayload {
  van_system_id: string;
}

export interface VANSurveyQuestionResponseOption {
  surveyResponseId: number;
  name: string;
  mediumName: string;
  shortName: string;
}

export interface VANSurveyQuestion {
  surveyQuestionId: number;
  type: string;
  cycle: number;
  name: string;
  mediumName: string;
  shortName: string;
  scriptQuestion: string;
  status: VANDataCollectionStatus;
  responses: VANSurveyQuestionResponseOption[];
}

export const fetchVANSurveyQuestions: Task = async (
  payload: GetSurveyQuestionsPayload,
  helpers: JobHelpers
) => {
  const auth = await getVanAuth(helpers, payload);

  const limit = 50;
  let offset = 0;
  let hasNextPage = false;
  let surveyQuestions: VANSurveyQuestion[] = [];
  do {
    const response = await get("/surveyQuestions")
      .query({
        $top: limit,
        $skip: offset
      })
      .use(withVan(auth));
    const { body } = response;
    hasNextPage = body.nextPageLink !== null;
    offset += limit;
    surveyQuestions = surveyQuestions.concat(body.items);
  } while (hasNextPage);

  const result = surveyQuestions.map((sq) => ({
    van_system_id: payload.van_system_id,
    survey_question_id: sq.surveyQuestionId,
    type: sq.type,
    cycle: sq.cycle,
    name: sq.name,
    medium_name: sq.mediumName,
    short_name: sq.shortName,
    script_question: sq.scriptQuestion,
    status: sq.status.toLowerCase(),
    responses: sq.responses.map((sqro) => ({
      survey_question_response_option_id: sqro.surveyResponseId,
      name: sqro.name,
      medium_name: sqro.mediumName,
      short_name: sqro.shortName
    }))
  }));

  await handleResult(helpers, payload, result);
};

export default fetchVANSurveyQuestions;
