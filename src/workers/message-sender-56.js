import { messageSender56 } from "./job-processes";
import logger from "../logger";

messageSender56().catch(err => {
  logger.error(err);
});
