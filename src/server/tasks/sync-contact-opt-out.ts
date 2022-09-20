import type { JobHelpers, Task } from "graphile-worker";

import { ExternalSystemType } from "../api/types";
import VAN from "../external-systems/van";

const syncContactOptOut: Task = async (
  payload: Record<string, any>,
  helpers: JobHelpers
) => {
  switch (payload.externalSystem) {
    case ExternalSystemType.Van:
      VAN.syncOptOut(payload);
      break;
    default:
      helpers.logger.error("Unsupported External System");
  }
};

export default syncContactOptOut;
