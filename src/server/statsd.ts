import StatsD from "hot-shots";

import { config } from "../config";
import logger from "../logger";
import { errToObj } from "./utils";

export default new StatsD({
  host: config.DD_AGENT_HOST,
  port: config.DD_DOGSTATSD_PORT,
  errorHandler: (err: Error) =>
    logger.error("connect-datadog encountered error: ", errToObj(err))
});
