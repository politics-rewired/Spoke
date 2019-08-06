const { config } = require("../config");

// Define a Knex connection. Currently, this is used only to instantiate the
// rethink-knex-adapter's connection. In the future, if the adapter is
// deprecated, a better pattern would be to instantiate knex here and export
// that instance, for reference everywhere else in the codebase.

const pg = require("pg");
// see https://github.com/tgriesser/knex/issues/852
pg.defaults.ssl = config.DB_USE_SSL;

// Default to SQLite
let knexConfig = {
  client: "sqlite3",
  connection: { filename: "./mydb.sqlite" },
  defaultsUnsupported: true
};

// https://dba.stackexchange.com/questions/164419/is-it-possible-to-limit-timeout-on-postgres-server
const pgAfterCreate = (conn, done) =>
  conn.query(
    `SET idle_in_transaction_session_timeout = ${config.DB_IDLE_TIMEOUT_MS};`,
    (error, _results, _fields) => done(error, conn)
  );

// Set connection to utf8mb4 collation
const mySqlAfterCreate = (conn, done) =>
  conn.query(
    "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;",
    (error, _results, _fields) => done(error, conn)
  );

if (config.isTest) {
  knexConfig = {
    client: "pg",
    connection: {
      host: config.DB_HOST,
      port: config.DB_PORT,
      database: "spoke_test",
      password: "spoke_test",
      user: "spoke_test",
      ssl: config.DB_USE_SSL
    }
  };
} else if (config.DB_JSON) {
  knexConfig = JSON.parse(config.DB_JSON);
} else if (config.DATABASE_URL) {
  let dbType = config.DATABASE_URL.match(/^\w+/)[0];
  dbType = /postgres/.test(dbType) ? "pg" : dbType;
  const afterCreate = /mysql/.test(dbType) ? mySqlAfterCreate : pgAfterCreate;
  knexConfig = {
    client: dbType,
    connection: config.DATABASE_URL,
    pool: {
      min: config.DB_MAX_POOL,
      max: config.DB_MAX_POOL,
      idleTimeoutMillis: config.DB_IDLE_TIMEOUT_MS,
      reapIntervalMillis: config.DB_REAP_INTERVAL_MS,
      afterCreate
    },
    ssl: config.DB_USE_SSL
  };
} else if (config.DB_TYPE && config.DB_TYPE !== "sqlite3") {
  const afterCreate = /mysql/.test(config.DB_TYPE)
    ? mySqlAfterCreate
    : pgAfterCreate;
  knexConfig = {
    client: config.DB_TYPE,
    connection: {
      host: config.DB_HOST,
      port: config.DB_PORT,
      database: config.DB_NAME,
      password: config.DB_PASSWORD,
      user: config.DB_USER,
      ssl: config.DB_USE_SSL
    },
    pool: {
      min: config.DB_MAX_POOL,
      max: config.DB_MAX_POOL,
      idleTimeoutMillis: config.DB_IDLE_TIMEOUT_MS,
      reapIntervalMillis: config.DB_REAP_INTERVAL_MS,
      afterCreate
    }
  };
}

const seedSettings = {
  seeds: {
    directory: "./seeds"
  }
};

knexConfig = Object.assign(knexConfig, seedSettings);

module.exports = knexConfig;
