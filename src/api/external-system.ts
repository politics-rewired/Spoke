import { RelayPaginatedResponse } from "./pagination";
import { ExternalList } from "./external-list";
import { ExternalSurveyQuestion } from "./external-survey-question";

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
  
  input ExternalSystemInput {
    name: String!
    type: ExternalSystemType!
    username: String!
    apiKey: String!
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
    surveyQuestions(after: Cursor, first: Int): ExternalSurveyQuestionPage!
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
