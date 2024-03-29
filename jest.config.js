module.exports = {
  verbose: true,
  testURL: "http://localhost/",
  testEnvironment: "node",
  globals: {
    DB_JSON: JSON.stringify({
      client: "pg",
      connection: {
        host: "127.0.0.1",
        port: "5432",
        database: "spoke_test",
        password: "spoke_test",
        user: "spoke_test"
      }
    }),
    JOBS_SYNC: "1",
    JOBS_SAME_PROCESS: "1",
    RETHINK_KNEX_NOREFS: "1", // avoids db race conditions
    DEFAULT_SERVICE: "fakeservice",
    DATABASE_SETUP_TEARDOWN_TIMEOUT: 60000,
    PASSPORT_STRATEGY: "localauthexperimental",
    SESSION_SECRET: "it is JUST a test! -- it better be!",
    TEST_ENVIRONMENT: "1"
  },
  globalSetup: "<rootDir>/__test__/setup.js",
  globalTeardown: "<rootDir>/__test__/teardown.js",
  testMatch: [
    "**/__tests__/**/*.js?(x),**/?(*.)(spec|test).js?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)"
  ],
  moduleFileExtensions: ["js", "jsx", "ts", "tsx"],
  modulePathIgnorePatterns: ["<rootDir>/build"],
  transform: { "\\.[jt]sx?$": "babel-jest" },
  moduleDirectories: ["node_modules"],
  moduleNameMapper: {
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "<rootDir>/__mocks__/fileMock.js",
    "\\.(css|less)$": "<rootDir>/__mocks__/styleMock.js"
  },
  collectCoverageFrom: [
    "**/*.{js,jsx}",
    "!**/node_modules/**",
    "!**/__test__/**",
    "!**/deploy/**",
    "!**/coverage/**"
  ],
  setupFilesAfterEnv: ["<rootDir>/__test__/setup-framework.js"],
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/__test__/e2e/"]
};
