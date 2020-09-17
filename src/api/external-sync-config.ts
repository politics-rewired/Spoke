import gql from "graphql-tag";

import { GraphQLType } from "./types";
import { ExternalResultCode } from "./external-result-code";
import { ExternalActivistCode } from "./external-activist-code";
import { ExternalSurveyQuestionResponseOption } from "./external-survey-question-response-option";

export interface ExternalResultCodeTarget {
  id: string;
  resultCode: ExternalResultCode;
}

export interface ExternalActivistCodeTarget {
  id: string;
  activistCode: ExternalActivistCode;
}

export interface ExternalSurveyQuestionResponseOptionTarget {
  id: string;
  responseOption: ExternalSurveyQuestionResponseOption;
}

export type ExternalSyncConfigTarget =
  | ExternalResultCodeTarget
  | ExternalActivistCodeTarget
  | ExternalSurveyQuestionResponseOptionTarget;

export function isActivistCode(
  obj: ExternalSyncConfigTarget
): obj is ExternalActivistCodeTarget {
  return (
    (obj as ExternalActivistCodeTarget & GraphQLType).__typename ===
    "ExternalActivistCodeTarget"
  );
}

export function isResponseOption(
  obj: ExternalSyncConfigTarget
): obj is ExternalSurveyQuestionResponseOptionTarget {
  return (
    (obj as ExternalSurveyQuestionResponseOptionTarget & GraphQLType)
      .__typename === "ExternalSurveyQuestionResponseOptionTarget"
  );
}

export function isResultCode(
  obj: ExternalSyncConfigTarget
): obj is ExternalResultCodeTarget {
  return (
    (obj as ExternalResultCodeTarget & GraphQLType).__typename ===
    "ExternalResultCodeTarget"
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
  targets: ExternalSyncConfigTarget[] | null;
}

export interface ExternalSyncTagConfig {
  id: string;
  systemId: string;
  tagId: string;
  isMissing: boolean;
  isRequired: boolean;
  targets: ExternalSyncConfigTarget[] | null;
}

export const schema = `
  type ExternalResultCodeTarget {
    id: String!
    resultCode: ExternalResultCode!
  }

  type ExternalActivistCodeTarget {
    id: String!
    activistCode: ExternalActivistCode!
  }

  type ExternalSurveyQuestionResponseOptionTarget {
    id: String!
    responseOption: ExternalSurveyQuestionResponseOption!
  }

  union ExternalSyncConfigTarget = ExternalResultCodeTarget | ExternalActivistCodeTarget | ExternalSurveyQuestionResponseOptionTarget

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
    targets(after: Cursor, first: Int): [ExternalSyncConfigTarget]
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
      ... on ExternalResultCodeTarget {
        id
        resultCode {
          id
          name
        }
      }
      ... on ExternalActivistCodeTarget {
        id
        activistCode {
          id
          name
          description
          scriptQuestion
          status
        }
      }
      ... on ExternalSurveyQuestionResponseOptionTarget {
        id
        responseOption {
          id
          name
          externalSurveyQuestionId
        }
      }
    }
  }
`;
