import { sqlResolvers } from "./lib/utils";

export interface ExternalSurveyQuestionResponseOption {
  system_id: string;
  external_survey_question_id: number;
  external_id: number;
  name: string;
  medium_name: string;
  short_name: string;
  created_at: string;
  updated_at: string;
}

export const resolvers = {
  ExternalSurveyQuestionResponseOption: {
    ...sqlResolvers([
      "systemId",
      "externalSurveyQuestionId",
      "externalId",
      "name",
      "mediumName",
      "shortName",
      "createdAt",
      "updatedAt"
    ]),
    id: (responseOption: ExternalSurveyQuestionResponseOption) => {
      const {
        system_id: systemId,
        external_survey_question_id: questionId,
        external_id: responseOptionId
      } = responseOption;
      return `${systemId}|${questionId}|${responseOptionId}`;
    }
  }
};
