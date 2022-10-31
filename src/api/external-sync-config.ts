import type {
  ExternalActivistCodeTarget,
  ExternalResultCodeTarget,
  ExternalSurveyQuestionResponseOptionTarget,
  ExternalSyncConfigTarget
} from "@spoke/spoke-codegen";
import type { GraphQLType } from "graphql";

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
