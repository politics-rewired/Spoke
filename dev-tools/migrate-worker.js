import { Pool } from "pg";
import { runMigrations } from "pg-compose";

import { config } from "../src/config";
import logger from "../src/logger";

const main = async () => {
  logger.info(`migrating with connection string ${config.DATABASE_URL}`);
  const pool = new Pool({ connectionString: config.DATABASE_URL });

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
