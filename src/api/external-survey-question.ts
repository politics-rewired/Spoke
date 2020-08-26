import { RelayPaginatedResponse } from "./pagination";
import { ExternalSurveyQuestionResponseOption } from "./external-survey-question-response-option";

export enum ExternalSurveyQuestionStatus {
  ACTIVE = "ACTIVE",
  ARCHIVED = "ARCHIVED",
  INACTIVE = "INACTIVE"
}

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
  status: ExternalSurveyQuestionStatus;
  createdAt: string;
  updatedAt: string;
  responses: RelayPaginatedResponse<ExternalSurveyQuestionResponseOption>;
}

export const schema = `
  enum ExternalSurveyQuestionStatus {
    ACTIVE
    ARCHIVED
    INACTIVE
  }

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
    status: ExternalSurveyQuestionStatus!
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
