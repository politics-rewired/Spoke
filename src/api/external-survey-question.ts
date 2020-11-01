import { ExternalSurveyQuestionResponseOption } from "./external-survey-question-response-option";
import { RelayPaginatedResponse } from "./pagination";
import { ExternalDataCollectionStatus } from "./types";

export interface ExternalSurveyQuestion {
  id: string;
  systemId: string;
  externalId: string;
  type: string;
  cycle: number;
  name: string;
  mediumName: string;
  shortName: string;
  scriptQuestion: string;
  status: ExternalDataCollectionStatus;
  createdAt: string;
  updatedAt: string;
  responseOptions: RelayPaginatedResponse<ExternalSurveyQuestionResponseOption>;
}

export const schema = `
  type ExternalSurveyQuestion {
    id: String!
    systemId: String!
    externalId: String!
    type: String!
    cycle: Int!
    name: String!
    mediumName: String!
    shortName: String!
    scriptQuestion: String!
    status: ExternalDataCollectionStatus!
    createdAt: String!
    updatedAt: String!
    responseOptions(after: Cursor, first: Int): ExternalSurveyQuestionResponseOptionPage!
  }

  type ExternalSurveyQuestionEdge {
    cursor: Cursor!
    node: ExternalSurveyQuestion!
  }

  type ExternalSurveyQuestionPage {
    edges: [ExternalSurveyQuestionEdge!]!
    pageInfo: RelayPageInfo!
  }
`;
