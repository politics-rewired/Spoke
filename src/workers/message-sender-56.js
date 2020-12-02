import logger from "../logger";
import { messageSender56 } from "./job-processes";

messageSender56().catch((err) => {
  logger.error(err);
});
