import {
  makeWorkerUtils,
  run,
  LogFunctionFactory,
  Logger,
  Runner,
  WorkerUtils
} from "graphile-worker";
import {
  run as runSchedule,
  Runner as ScheduleRunner
} from "graphile-scheduler";

import { config } from "../config";
import logger from "../logger";
import handleAutoassignmentRequest from "./tasks/handle-autoassignment-request";
import { Pool } from "pg";
import url from "url";
import { releaseStaleReplies } from "./tasks/release-stale-replies";

const logFactory: LogFunctionFactory = scope => (level, message, meta) =>
  logger.log({ level, message, ...meta, ...scope });
const graphileLogger = new Logger(logFactory);

let runner: Runner | undefined = undefined;
let scheduler: ScheduleRunner | undefined = undefined;
let runnerSemaphore = false;

// https://github.com/brianc/node-postgres/tree/master/packages/pg-pool#note
const params = url.parse(config.DATABASE_URL);
const auth = params.auth ? params.auth.split(":") : [];
const poolConfig = {
  user: auth[0],
  password: auth[1],
  host: params.hostname || undefined,
  port: params.port ? parseInt(params.port) : undefined,
  database: params.pathname ? params.pathname.split("/")[1] : undefined,
  ssl: config.DB_USE_SSL,
  max: config.WORKER_MAX_POOL
};

const workerPool = new Pool(poolConfig);

export const getRunner = async (
  attempt = 0
): Promise<{ runner: Runner; scheduler: ScheduleRunner }> => {
  // We are the first one to request the runner
  if (!runner && !runnerSemaphore) {
    runnerSemaphore = true;
    runner = await run({
      pgPool: workerPool,
      concurrency: config.WORKER_CONCURRENCY,
      logger: graphileLogger,
      // Signals are handled by Terminus
      noHandleSignals: true,
      pollInterval: 1000,
      taskList: {
        "handle-autoassignment-request": handleAutoassignmentRequest
      }
    });

    scheduler = await runSchedule({
      pgPool: new Pool({ ...poolConfig }),
      logger: graphileLogger,
      schedules: [
        {
          name: "release-stale-replies",
          pattern: "*/5 * * * *",
          timeZone: config.TZ,
          task: releaseStaleReplies
        }
      ]
    });
  }
  // Someone beat us to the punch of initializing the runner
  else if (!runner && runnerSemaphore) {
    if (attempt >= 20) throw new Error("getWorker() took too long to resolve");
    await new Promise((resolve, reject) => setTimeout(() => resolve(), 100));
    return getRunner(attempt + 1);
  }

  return { runner: runner!, scheduler: scheduler! };
};

let worker: WorkerUtils | undefined = undefined;
let workerSemaphore = false;
export const getWorker = async (attempt = 0): Promise<WorkerUtils> => {
  // We are the first one to request the worker
  if (!worker && !workerSemaphore) {
    workerSemaphore = true;
    worker = await makeWorkerUtils({
      pgPool: workerPool
    });
  }
  // Someone beat us to the punch of initializing the worker
  else if (!worker && workerSemaphore) {
    if (attempt >= 20) throw new Error("getWorker() took too long to resolve");
    await new Promise((resolve, reject) => setTimeout(() => resolve(), 100));
    return getWorker(attempt + 1);
  }

  return worker!;
};
