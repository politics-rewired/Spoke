/* eslint-disable global-require,import/no-unresolved */
require("dotenv").config();

// Environment variables will be populated from above, and influence the knex-connect import
let config;
try {
  config = require("./src/server/knex");
} catch {
  config = require("./build/src/server/knex");
}

module.exports = {
  development: config,
  test: { ...config, connection: process.env.TEST_DATABASE_URL },
  staging: config,
  production: config
};
