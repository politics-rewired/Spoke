import { RelayPaginatedResponse } from "./pagination";
import { ExternalList } from "./external-list";
import { ExternalSurveyQuestion } from "./external-survey-question";
import { ExternalActivistCode } from "./external-activist-code";
import { ExternalResultCode } from "./external-result-code";

export enum ExternalSystemType {
  VAN = "VAN"
}

export interface ExternalSystem {
  id: string;
  name: string;
  type: ExternalSystemType;
  username: string;
  apiKey: string;
  organizationId: number;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  lists: RelayPaginatedResponse<ExternalList>;
  surveyQuestions: RelayPaginatedResponse<ExternalSurveyQuestion>;
  activistCodes: RelayPaginatedResponse<ExternalActivistCode>;
  resultCodes: RelayPaginatedResponse<ExternalResultCode>;
}

export interface ExternalSystemInput {
  name: string;
  type: ExternalSystemType;
  username: string;
  apiKey: string;
}

export const schema = `
  enum ExternalSystemType {
    VAN
  }

  enum ExternalDataCollectionStatus {
    ACTIVE
    ARCHIVED
    INACTIVE
  }
  
  input ExternalSystemInput {
    name: String!
    type: ExternalSystemType!
    username: String!
    apiKey: String!
  }

  input ExternalSurveyQuestionFilter {
    status: ExternalDataCollectionStatus
  }

  input ExternalActivistCodeFilter {
    status: ExternalDataCollectionStatus
  }

  type ExternalSystem {
    id: String!
    name: String!
    type: ExternalSystemType!
    username: String!
    apiKey: String!
    organizationId: Int!
    createdAt: String!
    updatedAt: String!
    syncedAt: String
    lists(after: Cursor, first: Int): ExternalListPage!
    surveyQuestions(filter: ExternalSurveyQuestionFilter, after: Cursor, first: Int): ExternalSurveyQuestionPage!
    activistCodes(filter: ExternalActivistCodeFilter, after: Cursor, first: Int): ExternalActivistCodePage!
    resultCodes(after: Cursor, first: Int): ExternalResultCodePage!
  }

  type ExternalSystemEdge {
    cursor: Cursor!
    node: ExternalSystem!
  }

  type ExternalSystemPage {
    edges: [ExternalSystemEdge!]!
    pageInfo: RelayPageInfo!
  }
`;
