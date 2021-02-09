import { Pool } from "pg";
import { runMigrations } from "pg-compose";

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

  await runMigrations({
    pgPool: pool,
    logger
  });

  await pool.end();
};

main()
  .then((result) => {
    logger.info("Finished migrating pg-compose", { result });
    process.exit(0);
  })
  .catch((err) => {
    logger.error("Error migrating pg-compose", err);
    process.exit(1);
  });
