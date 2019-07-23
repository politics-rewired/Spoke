require("dotenv").config();

// Environment variables will be populated from above, and influence the knex-connect import
const config = require("./src/server/knex");

module.exports = {
  development: config,
  test: config,
  staging: config,
  production: config
};
