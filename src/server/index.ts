import type { Knex } from "knex";
import { createLightship } from "lightship";
import cron from "node-cron";

import { config, ServerMode } from "../config";
import { sleep } from "../lib";
import logger from "../logger";
import { checkForBadDeliverability } from "./api/lib/alerts";
import { createApp } from "./app";
import { r } from "./models";
import { setupUserNotificationObservers } from "./notifications";
import { errToObj } from "./utils";
import { getWorker } from "./worker";

process.on("uncaughtException", (ex) => {
  logger.error("uncaughtException: ", ex);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  logger.error("unhandledRejection: ", err);
  process.exit(1);
});

const lightship = createLightship({
  detectKubernetes: true,
  shutdownDelay: config.isProduction ? config.SHUTDOWN_GRACE_PERIOD : 0,
  port: 9000,
  signals: ["SIGTERM", "SIGINT"],
  terminate: () => {
    logger.info("Cleanup finished, server is shutting down.");
    process.exit(1);
  }
});

if (config.MODE === ServerMode.Server || config.MODE === ServerMode.Dual) {
  // Launch Spoke Express application
  lightship.queueBlockingTask(
    createApp().then((app) => {
      return new Promise((resolve) => {
        const port = config.DEV_APP_PORT || config.PORT;
        const server = app.listen(port, () => {
          logger.info(`Node app is running on port ${port}`);
          resolve(undefined);
        });
        lightship.registerShutdownHandler(async () => {
          const spokeGracePeriodMs = config.isProduction ? 30 * 1000 : 0;
          logger.info(
            `Received kill signal, waiting ${spokeGracePeriodMs}ms before shutting down Spoke app...`
          );
          await sleep(spokeGracePeriodMs);
          server.close();
        });
      });
    })
  );

  // Launch deliverability cronjob
  const deliverabilityCron = cron.schedule(
    "0 */1 * * *",
    checkForBadDeliverability
  );
  lightship.registerShutdownHandler(async () => {
    deliverabilityCron.destroy();
  });

  // Register notification observers
  setupUserNotificationObservers();
}

if (config.MODE === ServerMode.Worker || config.MODE === ServerMode.Dual) {
  // Launch pg-compose worker
  lightship.queueBlockingTask(getWorker());
  lightship.registerShutdownHandler(async () => {
    const worker = await getWorker();
    await worker.stop();
    logger.info("Tore down Graphile runner");
  });
}

// Always tear down Knex Postgres pools
lightship.registerShutdownHandler(async () => {
  logger.info("Starting cleanup of Knex Postgres pools.");
  const teardown = (pool: Knex, name: string) =>
    pool
      .destroy()
      .catch((err) =>
        logger.error(`Could not tear down knex ${name} pool: `, errToObj(err))
      );

  const promises = [teardown(r.knex, "primary")];
  if (config.DATABASE_READER_URL) {
    promises.push(teardown(r.reader, "reader"));
  }
  await Promise.all(promises);
});

// Ensure database is reachable
const healthCheckTimer = setInterval(
  () =>
    r.knex
      .raw("select 1")
      .then(() => lightship.signalReady())
      .catch(() => lightship.signalNotReady()),
  1000
);
lightship.registerShutdownHandler(async () => {
  clearInterval(healthCheckTimer);
});

// Signals will be queued until after all blocking tasks above are resolved
lightship.signalReady();
