import knex from "knex";
import logger from "../../logger";
import { config } from "../../config";
import knexConfig from "../../server/knex";

const TEAM_ID = config.SPANISH_TEAM_ID;

const spokeDb = knex(knexConfig);
const assignmentManagerDb = knex({
  client: "mysql",
  connection: config.ASSIGNMENT_MANAGER_DATABASE_URL
});

const main = async () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - 5.5);
  const fiveAndAHalfMinutesAgo = now;

  const newAssignmentUsers = await assignmentManagerDb("berniesms_shiftrequest")
    .select(["auth_user.email", "auth_user.first_name"])
    .join("auth_user", "auth_user.id", "=", "user_id")
    .where(
      "berniesms_shiftrequest.created",
      ">",
      fiveAndAHalfMinutesAgo.toISOString()
    );

  const membersOfTeam = await spokeDb("user_team")
    .select("user.email")
    .join("user", "id", "=", "user_id")
    .where({ team_id: TEAM_ID })
    .whereIn("email", newAssignmentUsers.map(na => na.email));

  for (let member of membersOfTeam) {
    const assignmentManagerDbUser = newAssignmentUsers.find(
      na => na.email === member.email
    );

    await assignmentManagerDb("auth_user")
      .update({ first_name: `SP ${assignmentManagerDbUser.first_name}` })
      .where({ email: member.email });

    logger.info("Updated user with prefix SP", assignmentManagerDbUser);
  }
};

main()
  .then(result => {
    console.log(result);
    process.exit(0);
  })
  .catch(err => {
    console.error("Update SMS Spanish Speakers failed", err);
    process.exit(1);
  });
