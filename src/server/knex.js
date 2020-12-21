const { config } = require("../config");
const logger = require("../logger");

// Define a Knex connection. Currently, this is used only to instantiate the
// rethink-knex-adapter's connection. In the future, if the adapter is
// deprecated, a better pattern would be to instantiate knex here and export
// that instance, for reference everywhere else in the codebase.

const knexConfig = {
  client: "pg",
  connection: config.isTest ? config.TEST_DATABASE_URL : config.DATABASE_URL,
  pool: {
    min: config.DB_MAX_POOL,
    max: config.DB_MAX_POOL,
    idleTimeoutMillis: config.DB_IDLE_TIMEOUT_MS,
    reapIntervalMillis: config.DB_REAP_INTERVAL_MS
  },
  log: {
    warn: (message) => logger.warn(`knex error: ${message}`),
    error: (message) => logger.error(`knex error: ${message}`),
    deprecate: (message) => logger.info(`knex error: ${message}`),
    debug: (message) => logger.debug(`knex error: ${message}`)
  }
};

const useReader = !!config.DATABASE_READER_URL;

const readerConfig =
  useReader && !config.isTest
    ? { ...knexConfig, connection: config.DATABASE_READER_URL }
    : knexConfig;

knexConfig.readerConfig = readerConfig;
knexConfig.useReader = useReader;

module.exports = knexConfig;
