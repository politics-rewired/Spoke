import logger from "../logger";
import { messageSender01 } from "./job-processes";

messageSender01().catch(err => {
  logger.error(err);
});
