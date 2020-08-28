import { r } from "../models";
import { sqlResolvers } from "./lib/utils";
import {
  ExternalSyncConfigTarget,
  isResultCode,
  isActivistCode,
  isResponseOption
} from "../../api/external-sync-config";

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
      if (isActivistCode(obj)) {
        return "ExternalActivistCode";
      }
      if (isResponseOption(obj)) {
        return "ExternalSurveyQuestionResponseOption";
      }
      // This must come last because isResultCode() is broken
      if (isResultCode(obj)) {
        return "ExternalResultCode";
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
        .reader("interaction_step")
        .where({ id: qrConfig.interaction_step_id })
        .first(),
    targets: (qrConfig: ExternalSyncQuestionResponseConfig) =>
      qrConfig.is_missing
        ? null
        : r.reader("external_sync_config_question_response_targets").where({
            campaign_id: qrConfig.campaign_id,
            interaction_step_id: qrConfig.interaction_step_id,
            question_response_value: qrConfig.question_response_value
          })
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
    targets: (tagConfig: ExternalSyncTagConfig) =>
      tagConfig.is_missing
        ? null
        : r.reader("external_sync_config_tag_targets").where({
            system_id: tagConfig.system_id,
            tag_id: tagConfig.tag_id
          })
  }
};
