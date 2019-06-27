// Define a Knex connection. Currently, this is used only to instantiate the
// rethink-knex-adapter's connection. In the future, if the adapter is
// deprecated, a better pattern would be to instantiate knex here and export
// that instance, for reference everywhere else in the codebase.
const {
  DB_USE_SSL = "false",
  DB_JSON = global.DB_JSON,
  DB_HOST = "127.0.0.1",
  DB_PORT = "5432",
  DB_MIN_POOL = 2,
  DB_MAX_POOL = 10,
  // free resouces are destroyed after this many milliseconds
  DB_IDLE_TIMEOUT_MS = 30000,
  // how often to check for idle resources to destroy
  DB_REAP_INTERVAL_MS = 1000,
  DB_TYPE,
  DB_NAME,
  DB_PASSWORD,
  DB_USER,
  DATABASE_URL,
  NODE_ENV
} = process.env;
const min = parseInt(DB_MIN_POOL, 10);
const max = parseInt(DB_MAX_POOL, 10);
const idleTimeoutMillis = parseInt(DB_IDLE_TIMEOUT_MS);
const reapIntervalMillis = parseInt(DB_REAP_INTERVAL_MS);
const IDLE_TRANSACTION_TIMEOUT = 30 * 1000;

const pg = require("pg");

const useSSL = DB_USE_SSL === "1" || DB_USE_SSL.toLowerCase() === "true";
if (useSSL) pg.defaults.ssl = true;
// see https://github.com/tgriesser/knex/issues/852

let config;

// https://dba.stackexchange.com/questions/164419/is-it-possible-to-limit-timeout-on-postgres-server
const pgAfterCreate = (conn, done) =>
  conn.query(
    `SET idle_in_transaction_session_timeout = ${IDLE_TRANSACTION_TIMEOUT};`,
    (error, _results, _fields) => done(error, conn)
  );

// Set connection to utf8mb4 collation
const mySqlAfterCreate = (conn, done) =>
  conn.query(
    "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;",
    (error, _results, _fields) => done(error, conn)
  );

if (NODE_ENV === "test") {
  config = {
    client: "pg",
    connection: {
      host: DB_HOST,
      port: DB_PORT,
      database: "spoke_test",
      password: "spoke_test",
      user: "spoke_test",
      ssl: useSSL
    }
  };
} else if (DB_JSON) {
  config = JSON.parse(DB_JSON);
} else if (DB_TYPE) {
  config = {
    client: "pg",
    connection: {
      host: DB_HOST,
      port: DB_PORT,
      database: DB_NAME,
      password: DB_PASSWORD,
      user: DB_USER,
      ssl: useSSL
    },
    pool: {
      min,
      max,
      idleTimeoutMillis,
      reapIntervalMillis,
      afterCreate: pgAfterCreate
    }
  };
} else if (DATABASE_URL) {
  const dbType = DATABASE_URL.match(/^\w+/)[0];
  const afterCreate = /mysql/.test(dbType) ? mySqlAfterCreate : pgAfterCreate;
  config = {
    client: /postgres/.test(dbType) ? "pg" : dbType,
    connection: DATABASE_URL,
    pool: { min, max, idleTimeoutMillis, reapIntervalMillis, afterCreate },
    ssl: useSSL
  };
} else {
  config = {
    client: "sqlite3",
    connection: { filename: "./mydb.sqlite" },
    defaultsUnsupported: true
  };
}

export default config;
