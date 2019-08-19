import { messageSender789 } from "./job-processes";
import logger from "../logger";

messageSender789().catch(err => {
  logger.error(err);
});
