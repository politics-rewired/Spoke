import { runMigrations } from "graphile-worker";

import { config } from "../src/config";
import logger from "../src/logger";

const main = async () => {
  logger.info(`migrating with connectio string ${config.DATABASE_URL}`);
  await runMigrations({
    connectionString: config.DATABASE_URL,
    logger
  });
};

main()
  .then(result => {
    logger.info("Finished migrating worker", { result });
    process.exit(0);
  })
  .catch(err => {
    logger.error("Error migrating worker: ", err);
    process.exit(1);
  });
