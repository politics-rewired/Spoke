try {
  require("dotenv").config();
} catch (ex) {
  // do nothing
}

const config = {
  client: "mysql",
  connection: process.env.DATABASE_URL,
  pool: {
    min: 2,
    max: 10
  }
};

const db = require("knex")(config);

async function main() {
  let oneHourAgo = new Date(),
    oneWeekAgo = new Date();
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

  const campaignContactIdsToRelease = selectResult[0].map(rdp => rdp.id);

  const updateResult = await db("campaign_contact")
    // TODO - MySQL Specific. use knex.fn.now()
    .update({
      assignment_id: null,
      updated_at: db.raw("now()")
    })
    // TODO - MySQL Specific. Getting contactIds can be done in subquery
    .whereIn("id", campaignContactIdsToRelease);

  return `Released ${updateResult} unsent initials that had stayed untouched for the last hour`;
}

main()
  .then(result => {
    console.log(result);
    process.exit(0);
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
