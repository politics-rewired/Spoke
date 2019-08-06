const envalid = require("envalid");
const { str, port } = envalid;

const validators = {
  ASSETS_DIR: str({
    desc:
      "Directory path where front-end packaged JavaScript is saved and loaded.",
    default: "./build/client/assets"
  }),
  ASSETS_MAP_FILE: str({
    desc:
      "File name of map file, within ASSETS_DIR, containing map of general file names to unique build-specific file names.",
    default: "assets.json"
  }),
  NODE_ENV: str({
    desc: "Node environment",
    choices: ["production", "development", "test"],
    default: "development",
    isClient: true
  }),
  OUTPUT_DIR: str({
    desc: "Directory path for packaged files should be saved to. Required.",
    default: "./build"
  }),
  PHONE_NUMBER_COUNTRY: str({
    desc: "Country code for phone number formatting.",
    default: "US",
    isClient: true
  }),
  PORT: port({
    desc: "Port for Heroku servers.",
    default: 3000
  }),
  PUBLIC_DIR: str({
    desc: "Directory path server should use to serve files. Required.",
    default: "./build/client"
  })
};

config = envalid.cleanEnv(process.env, validators, {
  strict: true
});

module.exports = {
  config
};
