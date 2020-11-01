import knex from "knex";

import { config } from "../../config";
import logger from "../../logger";
import knexConfig from "../../server/knex";

const spokeDb = knex(knexConfig);
const assignmentManagerDb = knex({
  client: "mysql",
  connection: config.ASSIGNMENT_MANAGER_DATABASE_URL
});

const TEXTER_STATUS_MAP = {
  "do-not-assign": "do_not_approve",
  "full-member": "auto_approve",
  "in-training": "auto_approve"
};

const main = async () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - 5.5);
  const fiveAndAHalfMinutesAgo = now;

  const texterRankUpdates = await assignmentManagerDb("berniesms_texter")
    .select("rank", "email")
    .join("auth_user", "auth_user.id", "=", "user_id")
    .where(
      "berniesms_texter.updated_at",
      ">",
      fiveAndAHalfMinutesAgo.toISOString()
    );

  for (const texterRank of texterRankUpdates) {
    const { email, rank } = texterRank;

    if (TEXTER_STATUS_MAP[rank]) {
      await spokeDb("user_organization")
        .update({
          request_status: TEXTER_STATUS_MAP[rank]
        })
        .whereIn(
          "user_id",
          spokeDb("user")
            .select("id")
            .where({ email })
        );

      console.log(`Updated rank for ${email} to ${rank}`);
    }
  }
};

main()
  .then(result => {
    console.log(result);
    process.exit(0);
  })
  .catch(err => {
    console.error("Update texter status failed", err);
    process.exit(1);
  });
