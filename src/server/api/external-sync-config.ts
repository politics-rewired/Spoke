import { r } from "../models";
import { sqlResolvers } from "./lib/utils";
import { formatPage } from "./lib/pagination";
import { ExternalSurveyQuestionResponseOption } from "./external-survey-question-response-option";
import { ExternalActivistCode } from "./external-activist-code";
import { ExternalResultCode } from "./external-result-code";

interface ExternalSyncTargetType {
  target_type: "response_option" | "activist_code" | "result_code";
}

export type ExternalSyncConfigTarget =
  | ExternalResultCode
  | ExternalActivistCode
  | ExternalSurveyQuestionResponseOption;

export function isActivistCode(
  obj: ExternalSyncConfigTarget
): obj is ExternalActivistCode {
  return (
    (obj as ExternalSyncConfigTarget & ExternalSyncTargetType).target_type ===
    "activist_code"
  );
}

export function isResponseOption(
  obj: ExternalSyncConfigTarget
): obj is ExternalSurveyQuestionResponseOption {
  return (
    (obj as ExternalSyncConfigTarget & ExternalSyncTargetType).target_type ===
    "response_option"
  );
}

export function isResultCode(
  obj: ExternalSyncConfigTarget
): obj is ExternalResultCode {
  return (
    (obj as ExternalSyncConfigTarget & ExternalSyncTargetType).target_type ===
    "result_code"
  );
}

export interface ExternalSyncQuestionResponseConfig {
  campaign_id: number;
  interaction_step_id: number;
  question_response_value: string;
  is_empty: boolean;
  is_missing: boolean;
  is_required: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface ExternalSyncTagConfig {
  system_id: string;
  tag_id: number;
  is_empty: boolean;
  is_missing: boolean;
  is_required: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export const resolvers = {
  ExternalSyncConfigTarget: {
    __resolveType(obj: ExternalSyncConfigTarget) {
      if (isResultCode(obj)) {
        return "ExternalResultCode";
      }
      if (isActivistCode(obj)) {
        return "ExternalActivistCode";
      }
      if (isResponseOption(obj)) {
        return "ExternalSurveyQuestionResponseOption";
      }

      return null;
    }
  },
  ExternalSyncQuestionResponseConfig: {
    ...sqlResolvers([
      "campaignId",
      "interactionStepId",
      "questionResponseValue",
      "isMissing",
      "isRequired",
      "createdAt",
      "updatedAt"
    ]),
    id: (qrConfig: ExternalSyncQuestionResponseConfig) => {
      const {
        question_response_value: responseValue,
        interaction_step_id: iStepId,
        campaign_id: campaignId
      } = qrConfig;
      return `${responseValue}|${iStepId}|${campaignId}`;
    },
    interactionStep: async (qrConfig: ExternalSyncQuestionResponseConfig) =>
      r
        .knex("interaction_step")
        .where({ id: qrConfig.interaction_step_id })
        .first(),
    targets: async (
      qrConfig: ExternalSyncQuestionResponseConfig,
      { after, first }: { after: string; first: number }
    ) => {
      if (qrConfig.is_missing) return null;

      const query = r
        .knex("external_sync_config_question_response_targets")
        .where({
          campaign_id: qrConfig.campaign_id,
          interaction_step_id: qrConfig.interaction_step_id,
          question_response_value: qrConfig.question_response_value
        });
      return formatPage(query, { after, first, primaryColumn: "config_id" });
    }
  },
  ExternalSyncTagConfig: {
    ...sqlResolvers([
      "systemId",
      "tagId",
      "isMissing",
      "isRequired",
      "createdAt",
      "updatedAt"
    ]),
    id: (tagConfig: ExternalSyncTagConfig) =>
      `${tagConfig.system_id}|${tagConfig.tag_id}`,
    tag: (tagConfig: ExternalSyncTagConfig) =>
      r
        .reader("all_tag")
        .where({ id: tagConfig.tag_id })
        .first(),
    targets: (
      tagConfig: ExternalSyncTagConfig,
      { after, first }: { after: string; first: number }
    ) => {
      if (tagConfig.is_missing) return null;

      const query = r.knex("external_sync_config_tag_targets").where({
        system_id: tagConfig.system_id,
        tag_id: tagConfig.tag_id
      });
      return formatPage(query, { after, first, primaryColumn: "compound_id" });
    }
  }
};
