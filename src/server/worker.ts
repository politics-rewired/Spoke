import url from "url";
import { Pool } from "pg";
import { LogFunctionFactory, Logger, Runner } from "graphile-worker";
import { run, loadYaml, PgComposeWorker } from "pg-compose";

import { config } from "../config";
import logger from "../logger";
import handleAutoassignmentRequest from "./tasks/handle-autoassignment-request";
import handleDeliveryReport from "./tasks/handle-delivery-report";
import { releaseStaleReplies } from "./tasks/release-stale-replies";

const logFactory: LogFunctionFactory = scope => (level, message, meta) =>
  logger.log({ level, message, ...meta, ...scope });

const graphileLogger = new Logger(logFactory);

let worker: PgComposeWorker | undefined = undefined;
let workerSemaphore = false;

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

export const workerPool = new Pool(poolConfig);

export const getWorker = async (attempt = 0): Promise<PgComposeWorker> => {
  const m = await loadYaml({ include: `${__dirname}/pg-compose/**/*.yaml` });

  m.taskList!["handle-autoassignment-request"] = handleAutoassignmentRequest;
  m.taskList!["release-stale-replies"] = releaseStaleReplies;
  m.taskList!["handle-delivery-report"] = handleDeliveryReport;

  m.cronJobs!.push({
    name: "release-stale-replies",
    task_name: "release-stale-replies",
    pattern: "*/5 * * * *",
    time_zone: config.TZ
  });

  if (!worker) {
    workerSemaphore = true;

    worker = await run(m, {
      pgPool: workerPool,
      encryptionSecret: config.SESSION_SECRET,
      concurrency: config.WORKER_CONCURRENCY,
      logger: graphileLogger,
      // Signals are handled by Terminus
      noHandleSignals: true,
      pollInterval: 1000
    });
  }

  // Someone beat us to the punch of initializing the runner
  else if (!worker && workerSemaphore) {
    if (attempt >= 20) throw new Error("getWorker() took too long to resolve");
    await new Promise((resolve, reject) => setTimeout(() => resolve(), 100));
    return getWorker(attempt + 1);
  }

  return worker!;
};
