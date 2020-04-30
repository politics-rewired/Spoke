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
  test: config,
  staging: config,
  production: config
};
