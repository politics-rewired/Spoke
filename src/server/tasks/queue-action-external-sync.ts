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
  const [syncId] = await r
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
    .first();

  const payload = {
    syncId,
    campaignContactId
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
        helpers.logger.error("Unsupported action type given");
    }
  } else {
    helpers.logger.error("Unsupported external system found");
  }
};

export default queueActionExternalSync;
