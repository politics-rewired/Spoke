import { sqlResolvers } from "./lib/utils";
import { formatPage } from "./lib/pagination";
import { r } from "../models";
import { RelayPageArgs, ExternalDataCollectionStatus } from "./types";

export interface ExternalSurveyQuestion {
  system_id: string;
  external_id: number;
  type: string;
  cycle: number;
  name: string;
  medium_name: string;
  short_name: string;
  script_question: string;
  status: ExternalDataCollectionStatus;
  created_at: string;
  updated_at: string;
}

export const resolvers = {
  ExternalSurveyQuestion: {
    ...sqlResolvers([
      "systemId",
      "externalId",
      "type",
      "cycle",
      "name",
      "mediumName",
      "shortName",
      "scriptQuestion",
      "createdAt",
      "updatedAt"
    ]),
    id: (surveyQuestion: ExternalSurveyQuestion) =>
      `${surveyQuestion.system_id}|${surveyQuestion.external_id}`,
    status: (surveyQuestion: ExternalSurveyQuestion) =>
      surveyQuestion.status.toUpperCase(),
    responseOptions: async (
      surveyQuestion: ExternalSurveyQuestion,
      { after, first }: RelayPageArgs
    ) => {
      const query = r.reader("external_survey_question_response_option").where({
        system_id: surveyQuestion.system_id,
        external_survey_question_id: surveyQuestion.external_id
      });
      return formatPage(query, { after, first, primaryColumn: "created_at" });
    }
  }
};
