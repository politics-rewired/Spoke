import type { JobHelpers, Task } from "graphile-worker";

import { ExternalSystemType } from "../api/types";
import VAN from "../external-systems/van";

const syncContactQuestionResponse: Task = async (
  payload: Record<string, any>,
  helpers: JobHelpers
) => {
  switch (payload.externalSystemType) {
    case ExternalSystemType.Van:
      VAN.syncQuestionResponse(payload, helpers);
      break;
    default:
      helpers.logger.error("Unsupported External System");
  }
};

export default syncContactQuestionResponse;
