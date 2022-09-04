import { Pool } from "pg";
import { Logger, runMigrations } from "graphile-worker";
import { migrate as migrateScheduler } from "graphile-scheduler/dist/migrate";

import { config } from "../src/config";
import logger from "../src/logger";

const main = async () => {
  const connectionString = config.isTest
    ? config.TEST_DATABASE_URL
    : config.DATABASE_URL;
  logger.info(
    `Using environment: ${config.NODE_ENV}. Migrating worker with connection string ${connectionString}`
  );
  const pool = new Pool({ connectionString });

  const logFactory = (scope) => (level, message, meta) =>
    logger.log({ level, message, ...meta, ...scope });
  const graphileLogger = new Logger(logFactory);

  await runMigrations({
    pgPool: pool,
    logger: graphileLogger
  });

  const client = await pool.connect();
  try {
    await migrateScheduler(
      {
        logger: graphileLogger
      },
      client
    );
  } finally {
    client.release();
  }

  await pool.end();
};

main()
  .then((result) => {
    logger.info("Finished migrating graphile-worker", { result });
    process.exit(0);
  })
  .catch((err) => {
    logger.error("Error migrating graphile-worker", err);
    process.exit(1);
  });
