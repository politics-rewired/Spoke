const _ = require("lodash");
const config = require("./jest.config");

const overrides = {
  setupFilesAfterEnv: ["<rootDir>/__test__/e2e/util/setup.js"],
  testMatch: ["**/__test__/e2e/**/*.test.js"],
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/__test__/e2e/util/",
    "<rootDir>/__test__/e2e/pom/"
  ],
  bail: true // To learn about errors sooner
};
const merges = {
  // Merge in changes to deeper objects
  globals: {
    // This sets the BASE_URL for the target of the e2e tests (what the tests are testing)
    BASE_URL: "localhost:3000"
  }
};

module.exports = _.chain(config).assign(overrides).merge(merges).value();
