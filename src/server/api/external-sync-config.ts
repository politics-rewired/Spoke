import { r } from "../models";
import { sqlResolvers } from "./lib/utils";
import { formatPage } from "./lib/pagination";

type ExternalSyncTarget = "response_option" | "activist_code" | "result_code";

interface ExternalSyncTargetType {
  target_type: ExternalSyncTarget;
}

export interface ExternalResultCodeTarget {
  id: string;
  question_response_config_id: string;
  external_result_code_id: string;
}

export interface ExternalActivistCodeTarget {
  id: string;
  question_response_config_id: string;
  external_activist_code_id: string;
}

export interface ExternalSurveyQuestionResponseOptionTarget {
  id: string;
  question_response_config_id: string;
  external_response_option_id: string;
}

export type ExternalSyncConfigTarget =
  | ExternalResultCodeTarget
  | ExternalActivistCodeTarget
  | ExternalSurveyQuestionResponseOptionTarget;

export function isActivistCodeTarget(
  obj: ExternalSyncConfigTarget
): obj is ExternalActivistCodeTarget {
  return (
    (obj as ExternalSyncConfigTarget & ExternalSyncTargetType).target_type ===
    "activist_code"
  );
}

export function isResponseOptionTarget(
  obj: ExternalSyncConfigTarget
): obj is ExternalSurveyQuestionResponseOptionTarget {
  return (
    (obj as ExternalSyncConfigTarget & ExternalSyncTargetType).target_type ===
    "response_option"
  );
}

export function isResultCodeTarget(
  obj: ExternalSyncConfigTarget
): obj is ExternalResultCodeTarget {
  return (
    (obj as ExternalSyncConfigTarget & ExternalSyncTargetType).target_type ===
    "result_code"
  );
}

export interface ExternalSyncQuestionResponseConfig {
  compound_id: string;
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
      if (isResultCodeTarget(obj)) {
        return "ExternalResultCodeTarget";
      }
      if (isActivistCodeTarget(obj)) {
        return "ExternalActivistCodeTarget";
      }
      if (isResponseOptionTarget(obj)) {
        return "ExternalSurveyQuestionResponseOptionTarget";
      }

      return null;
    }
  },
  ExternalResultCodeTarget: {
    ...sqlResolvers(["id"]),
    resultCode: async (target: ExternalResultCodeTarget) =>
      r
        .knex("external_result_code")
        .where({ id: target.external_result_code_id })
        .first()
  },
  ExternalActivistCodeTarget: {
    ...sqlResolvers(["id"]),
    activistCode: async (target: ExternalActivistCodeTarget) =>
      r
        .knex("external_activist_code")
        .where({ id: target.external_activist_code_id })
        .first()
  },
  ExternalSurveyQuestionResponseOptionTarget: {
    ...sqlResolvers(["id"]),
    responseOption: async (
      target: ExternalSurveyQuestionResponseOptionTarget
    ) =>
      r
        .knex("external_survey_question_response_option")
        .where({ id: target.external_response_option_id })
        .first()
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
    id: (qrConfig: ExternalSyncQuestionResponseConfig) => qrConfig.compound_id,
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

      const responseOptions = await r
        .knex("external_sync_config_question_response_response_option")
        .where({ question_response_config_id: qrConfig.compound_id })
        .select([r.knex.raw(`'response_option' as target_type`), "*"]);

      const activistCodes = await r
        .knex("external_sync_config_question_response_activist_code")
        .where({ question_response_config_id: qrConfig.compound_id })
        .select([r.knex.raw(`'activist_code' as target_type`), "*"]);

      const resultCodes = await r
        .knex("external_sync_config_question_response_result_code")
        .where({ question_response_config_id: qrConfig.compound_id })
        .select([r.knex.raw(`'result_code' as target_type`), "*"]);

      return [...responseOptions, ...activistCodes, ...resultCodes];
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
