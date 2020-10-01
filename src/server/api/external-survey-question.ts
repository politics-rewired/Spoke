import { sqlResolvers } from "./lib/utils";
import { formatPage } from "./lib/pagination";
import { r } from "../models";
import { RelayPageArgs, ExternalDataCollectionStatus } from "./types";

export interface ExternalSurveyQuestion {
  id: string;
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
      "id",
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
    status: (surveyQuestion: ExternalSurveyQuestion) =>
      surveyQuestion.status.toUpperCase(),
    responseOptions: async (
      surveyQuestion: ExternalSurveyQuestion,
      { after, first }: RelayPageArgs
    ) => {
      const query = r.reader("external_survey_question_response_option").where({
        external_survey_question_id: surveyQuestion.id
      });
      return formatPage(query, { after, first, primaryColumn: "created_at" });
    }
  }
};
