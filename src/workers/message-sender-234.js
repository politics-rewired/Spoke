import { messageSender234 } from "./job-processes";
import { log } from "../lib/log";

messageSender234().catch(err => {
  log.error(err);
});
