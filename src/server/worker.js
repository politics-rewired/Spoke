import { makeWorkerUtils, run, Logger } from "graphile-worker";

import { config } from "../config";
import logger from "../logger";
import handleAutoassignmentRequest from "./tasks/handle-autoassignment-request";

const logFactory = scope => (level, message, meta) =>
  logger.log({ level, message, ...meta, ...scope });
const graphileLogger = new Logger(logFactory);

let runner = undefined;
let runnerSemaphore = false;
export const getRunner = async (attempt = 0) => {
  // We are the first one to request the runner
  if (!runner && !runnerSemaphore) {
    runnerSemaphore = true;
    runner = await run({
      connectionString: config.DATABASE_URL,
      concurrency: 5,
      logger: graphileLogger,
      // Signals are handled by Terminus
      noHandleSignals: true,
      pollInterval: 1000,
      taskList: {
        "handle-autoassignment-request": handleAutoassignmentRequest
      }
    });
  }
  // Someone beat us to the punch of initializing the runner
  else if (!runner && runnerSemaphore) {
    if (attempt >= 20) throw new Error("getWorker() took too long to resolve");
    await new Promise((resolve, reject) => setTimeout(() => resolve(), 100));
    return getRunner(attempt + 1);
  }

  return runner;
};

let worker = undefined;
let workerSemaphore = false;
export const getWorker = async (attempt = 0) => {
  // We are the first one to request the worker
  if (!worker && !workerSemaphore) {
    workerSemaphore = true;
    worker = await makeWorkerUtils({
      connectionString: config.DATABASE_URL
    });
  }
  // Someone beat us to the punch of initializing the worker
  else if (!worker && workerSemaphore) {
    if (attempt >= 20) throw new Error("getWorker() took too long to resolve");
    await new Promise((resolve, reject) => setTimeout(() => resolve(), 100));
    return getWorker(attempt + 1);
  }

  return worker;
};
