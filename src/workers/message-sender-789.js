import logger from "../logger";
import { messageSender789 } from "./job-processes";

messageSender789().catch(err => {
  logger.error(err);
});
