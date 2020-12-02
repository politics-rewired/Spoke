import logger from "../../logger";
import knexConfig from "../../server/knex";

const db = require("knex")(knexConfig);

async function main() {
  const oneHourAgo = new Date();
  const oneWeekAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const selectResult = await db.raw(
    `
    select id
    from campaign_contact
    where assignment_id is not null
      and message_status = 'needsMessage'
      and updated_at > ?
      and updated_at < ?
  `,
    [oneWeekAgo, oneHourAgo]
  );

  const campaignContactIdsToRelease = selectResult[0].map((rdp) => rdp.id);

  const updateResult = await db("campaign_contact")
    // TODO - MySQL Specific. use knex.fn.now()
    .update({
      assignment_id: null
    })
    // TODO - MySQL Specific. Getting contactIds can be done in subquery
    .whereIn("id", campaignContactIdsToRelease);

  return `Released ${updateResult} unsent initials that had stayed untouched for the last hour`;
}

main()
  .then((result) => {
    logger.info(result);
    process.exit(0);
  })
  .catch((error) => {
    logger.error("Error releasing old unsent messages: ", error);
    process.exit(1);
  });
