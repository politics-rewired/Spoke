import { symmetricEncrypt } from "../src/server/api/lib/crypto";
import { r } from "../src/server/models";

require("dotenv").config();

const main = async () => {
  const inviteArgs = Object.values(process.argv);

  const scriptIndex = inviteArgs.findIndex(arg =>
    arg.includes("insert-invite.js")
  );
  inviteArgs.splice(0, scriptIndex + 1);

  let isHelp = false;
  const helpIndex = inviteArgs.findIndex(arg => arg.includes("help"));
  if (helpIndex >= 0) {
    isHelp = true;
    inviteArgs.splice(helpIndex, 1);
  }

  let includeEnv = false;
  const envIndex = inviteArgs.findIndex(arg => arg === "--include-env");
  if (envIndex >= 0) {
    includeEnv = true;
    inviteArgs.splice(envIndex, 1);
  }

  const hash = inviteArgs[0];
  if (!hash || hash.length === 0 || isHelp) {
    console.log(`
Insert a Spoke invite with the specified hash.

Usage: insert-invite HASH [--include-env]


    --include-env  Populate the invite \`payload\` from the current environment.
                   Currently, this supports adding a single messaging service using uppercase envvars.
    `);
    return;
  }

  const payload = {};
  if (includeEnv) {
    if (
      process.env.MESSAGING_SERVICE_SID &&
      process.env.ACCOUNT_SID &&
      process.env.UNENCRYPTED_AUTH_TOKEN &&
      process.env.SERVICE_TYPE
    ) {
      payload.messaging_services = [
        {
          messaging_service_sid: process.env.MESSAGING_SERVICE_SID,
          account_sid: process.env.ACCOUNT_SID,
          encrypted_auth_token: symmetricEncrypt(
            process.env.UNENCRYPTED_AUTH_TOKEN
          ),
          service_type: process.env.SERVICE_TYPE
        }
      ];
    } else {
      throw new Error("--include-env passed but missing required envvars!");
    }

    if (process.env.SWITCHBOARD_LRN_API_KEY) {
      payload.org_features = {
        switchboard_lrn_api_key: process.env.SWITCHBOARD_LRN_API_KEY
      };
    }
  }

  const existingRecord = await r
    .knex("invite")
    .where({ hash })
    .first("id");

  if (existingRecord) {
    console.info(`Invite with hash '${hash}' already exists!`);
    process.exit(0);
  }

  await r.knex("invite").insert({
    is_valid: true,
    hash,
    payload: JSON.stringify(payload)
  });
};

main()
  .then(() => {
    console.log("Success");
    process.exit(0);
  })
  .catch(error => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  });
