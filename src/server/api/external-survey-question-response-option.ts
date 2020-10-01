import { sqlResolvers } from "./lib/utils";

export interface ExternalSurveyQuestionResponseOption {
  id: string;
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
      "id",
      "externalSurveyQuestionId",
      "externalId",
      "name",
      "mediumName",
      "shortName",
      "createdAt",
      "updatedAt"
    ])
  }
};
