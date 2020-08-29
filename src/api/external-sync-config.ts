import gql from "graphql-tag";

import { GraphQLType } from "./types";
import { RelayPaginatedResponse } from "./pagination";
import { ExternalResultCode } from "./external-result-code";
import { ExternalActivistCode } from "./external-activist-code";
import { ExternalSurveyQuestionResponseOption } from "./external-survey-question-response-option";

export type ExternalSyncConfigTarget =
  | ExternalResultCode
  | ExternalActivistCode
  | ExternalSurveyQuestionResponseOption;

export function isActivistCode(
  obj: ExternalSyncConfigTarget
): obj is ExternalActivistCode {
  return (
    (obj as ExternalActivistCode & GraphQLType).__typename ===
    "ExternalActivistCode"
  );
}

export function isResponseOption(
  obj: ExternalSyncConfigTarget
): obj is ExternalSurveyQuestionResponseOption {
  return (
    (obj as ExternalSurveyQuestionResponseOption & GraphQLType).__typename ===
    "ExternalSurveyQuestionResponseOption"
  );
}

export function isResultCode(
  obj: ExternalSyncConfigTarget
): obj is ExternalResultCode {
  return (
    (obj as ExternalResultCode & GraphQLType).__typename ===
    "ExternalResultCode"
  );
}

export interface ExternalSyncQuestionResponseConfig {
  id: string;
  campaignId: string;
  interactionStepId: string;
  questionResponseValue: string;
  isMissing: boolean;
  isRequired: boolean;
  interactionStep: {
    id: string;
    questionText: string;
    parentInteractionId: string | null;
  };
  targets: RelayPaginatedResponse<ExternalSyncConfigTarget> | null;
}

export interface ExternalSyncTagConfig {
  id: string;
  systemId: string;
  tagId: string;
  isMissing: boolean;
  isRequired: boolean;
  targets: RelayPaginatedResponse<ExternalSyncConfigTarget> | null;
}

export const schema = `
  union ExternalSyncConfigTarget = ExternalResultCode | ExternalActivistCode | ExternalSurveyQuestionResponseOption

  type ExternalSyncConfigTargetEdge {
    cursor: Cursor!
    node: ExternalSyncConfigTarget!
  }

  type ExternalSyncConfigTargetPage {
    edges: [ExternalSyncConfigTargetEdge!]!
    pageInfo: RelayPageInfo!
  }

  type ExternalSyncQuestionResponseConfig {
    id: String!
    campaignId: String!
    interactionStepId: String!
    questionResponseValue: String!
    isMissing: Boolean!
    isRequired: Boolean!
    createdAt: String
    updatedAt: String
    interactionStep: InteractionStep!
    targets(after: Cursor, first: Int): ExternalSyncConfigTargetPage
  }

  type ExternalSyncQuestionResponseConfigEdge {
    cursor: Cursor!
    node: ExternalSyncQuestionResponseConfig!
  }

  type ExternalSyncQuestionResponseConfigPage {
    edges: [ExternalSyncQuestionResponseConfigEdge!]!
    pageInfo: RelayPageInfo!
  }

  type ExternalSyncTagConfig {
    id: String!
    systemId: String!
    tagId: String!
    isMissing: Boolean!
    isRequired: Boolean!
    createdAt: String
    updatedAt: String
    tag: Tag!
    targets(after: Cursor, first: Int): ExternalSyncConfigTargetPage
  }

  type ExternalSyncTagConfigEdge {
    cursor: Cursor!
    node: ExternalSyncTagConfig!
  }

  type ExternalSyncTagConfigPage {
    edges: [ExternalSyncTagConfigEdge!]!
    pageInfo: RelayPageInfo!
  }
`;

export const FullListRefreshFragment = gql`
  fragment FullListRefresh on ExternalSyncQuestionResponseConfig {
    id
    campaignId
    interactionStepId
    questionResponseValue
    isMissing
    isRequired
    createdAt
    updatedAt
    interactionStep {
      id
      scriptOptions
      questionText
      answerOption
      parentInteractionId
    }
    targets {
      edges {
        node {
          ... on ExternalResultCode {
            id
            name
          }
          ... on ExternalActivistCode {
            id
            name
            description
            scriptQuestion
            status
          }
          ... on ExternalSurveyQuestionResponseOption {
            id
            name
            externalSurveyQuestionId
          }
        }
      }
    }
  }
`;
