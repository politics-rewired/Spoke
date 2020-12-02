import { Task } from "pg-compose";
import { get } from "superagent";

import {
  VanAuthPayload,
  VANDataCollectionStatus,
  withVan
} from "../lib/external-systems";

interface GetSurveyQuestionsPayload extends VanAuthPayload {
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
  _helpers: any
) => {
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
      .use(withVan(payload));
    const { body } = response;
    hasNextPage = body.nextPageLink !== null;
    offset += limit;
    surveyQuestions = surveyQuestions.concat(body.items);
  } while (hasNextPage);

  return surveyQuestions.map((sq) => ({
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
};

export default fetchVANSurveyQuestions;
