import type { JobHelpers } from "graphile-worker";
import isNil from "lodash/isNil";
import type { SuperAgentRequest } from "superagent";

import { config } from "../../config";
import { DateTime } from "../../lib/datetime";
import type { IExternalSystem } from "../api/types";
import { ExternalSystemType } from "../api/types";
import { r } from "../models";

const DEFAULT_MODE = "0"; // VoterFile mode

export interface VanSecretAuthPayload {
  username: string;
  api_key: { __secret: string };
}

export enum VANDataCollectionStatus {
  Active = "Active",
  Archived = "Archived",
  Inactive = "Inactive"
}

export interface VanAuthPayload {
  username: string;
  api_key: string;
}

export const withVan = (van: VanAuthPayload) => (
  request: SuperAgentRequest
) => {
  const [apiKey, existingMode] = van.api_key.split("|");
  const mode = existingMode || DEFAULT_MODE;
  request.auth(van.username, `${apiKey}|${mode}`, { type: "basic" });
  request.url = `${config.VAN_BASE_URL}${request.url}`;
  return request;
};

const VAN: IExternalSystem = {
  async queueOptOut(
    payload: Record<string, any>,
    helpers: JobHelpers
  ): Promise<void> {
    const { campaignContactId, syncId } = payload;
    await helpers.addJob(
      "sync-contact-opt-out",
      {
        externalSystem: ExternalSystemType.Van,
        syncId,
        campaignContactId
      },
      {
        jobKey: `sync-contact-opt-out-${campaignContactId}`,
        jobKeyMode: "replace",
        maxAttempts: 5,
        runAt: DateTime.local().plus({ minutes: 1 }).toJSDate()
      }
    );
  },

  async queueQuestionResponse(
    payload: Record<string, any>,
    helpers: JobHelpers
  ): Promise<void> {
    const { campaignContactId, syncId } = payload;
    const actionData = await r
      .knex("action_external_system_sync")
      .join(
        "all_question_response",
        "all_question_response.id",
        "action_external_system_sync.action_id"
      )
      .join("all_external_sync_question_response_configuration", function () {
        this.on(function () {
          this.on(
            "all_external_sync_question_response_configuration.interaction_step_id",
            "=",
            "all_question_response.interaction_step_id"
          );
          this.andOn(
            "all_external_sync_question_response_configuration.question_response_value",
            "=",
            "all_question_response.value"
          );
        });
      })
      .where({ "action_external_system_sync.id": syncId })
      .first();

    if (isNil(actionData)) {
      await r
        .knex("action_external_system_sync")
        .update({ sync_status: "SKIPPED", sync_error: "No Mapping Found" })
        .where({ id: syncId });
    } else {
      await helpers.addJob(
        "sync-contact-question-response",
        {
          externalSystem: ExternalSystemType.Van,
          syncId,
          campaignContactId
        },
        {
          jobKey: `sync-contact-question-response-${campaignContactId}`,
          jobKeyMode: "replace",
          maxAttempts: 5,
          runAt: DateTime.local().plus({ minutes: 1 }).toJSDate()
        }
      );
      await r
        .knex("action_external_system_sync")
        .update({ sync_status: "SYNC_QUEUED" })
        .where({ id: syncId });
    }
  },

  async syncQuestionResponse(payload: Record<string, any>): Promise<void> {
    console.log("***********************");
    console.log(payload);
    console.log("***********************");
  },

  async syncOptOut(payload: Record<string, any>): Promise<void> {
    console.log("***********************");
    console.log(payload);
    console.log("***********************");
  }
};

export default VAN;
