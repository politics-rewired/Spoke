// const { config } = require("../config");
// Define a Knex connection. Currently, this is used only to instantiate the
// rethink-knex-adapter's connection. In the future, if the adapter is
// deprecated, a better pattern would be to instantiate knex here and export
// that instance, for reference everywhere else in the codebase.
import knex from "knex";
import pg from "pg";

import { config } from "../config";
import logger from "../logger";
// see https://github.com/tgriesser/knex/issues/852
pg.defaults.ssl = config.DB_USE_SSL;

type KnexConnectionURL = string;

const TEST_CONFIG: knex.PgConnectionConfig = {
  host: config.DB_HOST,
  port: config.DB_PORT,
  database: "spoke_test",
  password: "spoke_test",
  user: "spoke_test",
  ssl: config.DB_USE_SSL
};
const URL_CONFIG: KnexConnectionURL = config.DATABASE_URL;
const PROD_CONFIG: knex.PgConnectionConfig = {
  host: config.DB_HOST,
  port: config.DB_PORT,
  database: config.DB_NAME,
  password: config.DB_PASSWORD,
  user: config.DB_USER,
  ssl: config.DB_USE_SSL
};
const READER_URL_CONFIG: KnexConnectionURL = config.DATABASE_READER_URL;

export const knexConfig: knex.Config = {
  client: "pg",
  connection: (() => {
    if (config.DATABASE_READER_URL) {
      return READER_URL_CONFIG;
    }
    if (config.isTest) {
      return TEST_CONFIG;
    }
    if (config.DATABASE_URL) {
      return URL_CONFIG;
    }
    return PROD_CONFIG;
  })(),
  pool: {
    min: config.DB_MAX_POOL,
    max: config.DB_MAX_POOL,
    idleTimeoutMillis: config.DB_IDLE_TIMEOUT_MS,
    reapIntervalMillis: config.DB_REAP_INTERVAL_MS
  },
  log: {
    warn: (message: string) => logger.warn(`knex error: ${message}`),
    error: (message: string) => logger.error(`knex error: ${message}`),
    deprecate: (message: string) => logger.info(`knex error: ${message}`),
    debug: (message: string) => logger.debug(`knex error: ${message}`)
  }
} as const;

export default knexConfig;
