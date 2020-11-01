const { config } = require("../config");
const logger = require("../logger");

// Define a Knex connection. Currently, this is used only to instantiate the
// rethink-knex-adapter's connection. In the future, if the adapter is
// deprecated, a better pattern would be to instantiate knex here and export
// that instance, for reference everywhere else in the codebase.

const pg = require("pg");
// see https://github.com/tgriesser/knex/issues/852
pg.defaults.ssl = config.DB_USE_SSL;

let connection = {};

if (config.isTest) {
  connection = {
    host: config.DB_HOST,
    port: config.DB_PORT,
    database: "spoke_test",
    password: "spoke_test",
    user: "spoke_test",
    ssl: config.DB_USE_SSL
  };
} else if (config.DATABASE_URL) {
  connection = config.DATABASE_URL;
} else {
  connection = {
    host: config.DB_HOST,
    port: config.DB_PORT,
    database: config.DB_NAME,
    password: config.DB_PASSWORD,
    user: config.DB_USER,
    ssl: config.DB_USE_SSL
  };
}

const knexConfig = {
  client: "pg",
  connection,
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

const readerConfig = useReader
  ? { ...knexConfig, connection: config.DATABASE_READER_URL }
  : knexConfig;

knexConfig.readerConfig = readerConfig;
knexConfig.useReader = useReader;

module.exports = knexConfig;
