import { Task } from "pg-compose";
import { SuperAgentRequest, get } from "superagent";

import { config } from "../../config";

interface VanAuthPayload {
  username: string;
  api_key: string;
}

interface GetSurveyQuestionsPayload extends VanAuthPayload {
  van_system_id: string;
}

interface PaginatedVanResponse<T> {
  items: T[];
  count: number;
  nextPageLink: string;
}

const withVan = (van: VanAuthPayload) => (request: SuperAgentRequest) => {
  request.auth(van.username, `${van.api_key}|0`, { type: "basic" });
  request.url = `${config.VAN_BASE_URL}${request.url}`;
  return request;
};

export interface VANSurveyQuestionResponseOption {
  surveyResponseId: number;
  name: string;
  mediumName: string;
  shortName: string;
}

export enum VANSurveyQuestionStatus {
  Active = "Active",
  Archived = "Archived",
  Inactive = "Inactive"
}

export interface VANSurveyQuestion {
  surveyQuestionId: number;
  type: string;
  cycle: number;
  name: string;
  mediumName: string;
  shortName: string;
  scriptQuestion: string;
  status: VANSurveyQuestionStatus;
  responses: VANSurveyQuestionResponseOption[];
}

export const fetchVANSurveyQuestions: Task = async (
  payload: GetSurveyQuestionsPayload,
  _helpers: any
) => {
  const limit = 50;
  let offset = 0;
  let returnCount = 0;
  let surveyQuestions: VANSurveyQuestion[] = [];
  do {
    const response = await get("/surveyQuestions")
      .query({
        $top: limit,
        $skip: offset
      })
      .use(withVan(payload));
    const body: PaginatedVanResponse<VANSurveyQuestion> = response.body;
    returnCount = body.items.length;
    offset += limit;
    surveyQuestions = surveyQuestions.concat(body.items);
  } while (returnCount > 0);

  return surveyQuestions.map(sq => ({
    van_system_id: payload.van_system_id,
    survey_question_id: sq.surveyQuestionId,
    type: sq.type,
    cycle: sq.cycle,
    name: sq.name,
    medium_name: sq.mediumName,
    short_name: sq.shortName,
    script_question: sq.scriptQuestion,
    status: sq.status.toLowerCase(),
    responses: sq.responses.map(sqro => ({
      survey_question_response_option_id: sqro.surveyResponseId,
      name: sqro.name,
      medium_name: sqro.mediumName,
      short_name: sqro.shortName
    }))
  }));
};

export default fetchVANSurveyQuestions;
