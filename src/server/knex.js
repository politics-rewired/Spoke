const { config } = require("../config");

// Define a Knex connection. Currently, this is used only to instantiate the
// rethink-knex-adapter's connection. In the future, if the adapter is
// deprecated, a better pattern would be to instantiate knex here and export
// that instance, for reference everywhere else in the codebase.

const pg = require("pg");
// see https://github.com/tgriesser/knex/issues/852
pg.defaults.ssl = config.DB_USE_SSL;

// https://dba.stackexchange.com/questions/164419/is-it-possible-to-limit-timeout-on-postgres-server
const afterCreate = (conn, done) =>
  conn.query(
    `SET idle_in_transaction_session_timeout = ${config.DB_IDLE_TIMEOUT_MS};`,
    (error, _results, _fields) => done(error, conn)
  );

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
    reapIntervalMillis: config.DB_REAP_INTERVAL_MS,
    afterCreate
  },
  seeds: {
    directory: "./seeds"
  }
};

module.exports = knexConfig;
