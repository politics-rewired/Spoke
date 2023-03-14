import type { JobHelpers, Task } from "graphile-worker";

import { ActionType, ExternalSystemType } from "../api/types";
import VAN from "../external-systems/van";
import { r } from "../models";

interface queueActionExternalSyncPayload {
  actionId: number;
  actionType: ActionType;
  campaignContactId: number;
}

const queueActionExternalSync: Task = async (
  { actionId, actionType, campaignContactId }: queueActionExternalSyncPayload,
  helpers: JobHelpers
) => {
  const [{ id: syncId }] = await r
    .knex("action_external_system_sync")
    .insert({
      action_type: actionType,
      action_id: actionId
    })
    .returning("id");

  const externalSystem = await r
    .knex("external_system")
    .join("campaign", "campaign.external_system_id", "external_system.id")
    .join("campaign_contact", "campaign_contact.campaign_id", "campaign.id")
    .where({ "campaign_contact.id": campaignContactId })
    .first(["external_system.id", "external_system.type"]);

  const payload = {
    syncId,
    campaignContactId,
    externalSystemId: externalSystem.id
  };

  if (externalSystem.type === ExternalSystemType.Van) {
    switch (actionType) {
      case ActionType.OptOut:
        await VAN.queueOptOut(payload, helpers);
        break;
      case ActionType.QuestionReponse:
        await VAN.queueQuestionResponse(payload, helpers);
        break;
      default:
        await r
          .knex("action_external_system_sync")
          .where({ id: syncId })
          .update({
            sync_status: "SYNC_FAILED",
            sync_error: "Unsupported action type given"
          });
        helpers.logger.error("Unsupported action type given");
    }
  } else {
    await r.knex("action_external_system_sync").where({ id: syncId }).update({
      sync_status: "SYNC_FAILED",
      sync_error: "Unsupported external system given"
    });
    helpers.logger.error("Unsupported external system given");
  }
};

export default queueActionExternalSync;
