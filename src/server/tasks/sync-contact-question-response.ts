import type { JobHelpers, Task } from "graphile-worker";

import { ExternalSystemType } from "../api/types";
import VAN from "../external-systems/van";
import { r } from "../models";

const syncContactQuestionResponse: Task = async (
  payload: Record<string, any>,
  helpers: JobHelpers
) => {
  switch (payload.externalSystemType) {
    case ExternalSystemType.Van:
      VAN.syncQuestionResponse(payload, helpers);
      break;
    default:
      await r
        .knex("action_external_system_sync")
        .where({ id: payload.syncId })
        .update({
          sync_status: "SYNC_FAILED",
          sync_error: "Unsupported external system given"
        });
      helpers.logger.error("Unsupported External System");
  }
};

export default syncContactQuestionResponse;
