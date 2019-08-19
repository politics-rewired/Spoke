import { messageSender234 } from "./job-processes";
import logger from "../logger";

messageSender234().catch(err => {
  logger.error(err);
});
