import { messageSender01 } from "./job-processes";
import logger from "../logger";

messageSender01().catch(err => {
  logger.error(err);
});
