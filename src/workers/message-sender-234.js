import logger from "../logger";
import { messageSender234 } from "./job-processes";

messageSender234().catch(err => {
  logger.error(err);
});
