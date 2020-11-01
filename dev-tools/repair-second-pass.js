require("dotenv").config();

const config = {
  client: "mysql",
  connection: process.env.DATABASE_URL,
  pool: {
    min: 2,
    max: 30
  }
};

const db = require("knex")(config);

main().then(console.log).catch(console.error);

async function main() {
  const [results, _junk] = await db.raw(`
    select campaign_contact_id, count(message.id) as message_count
    from message
    join campaign_contact on campaign_contact.id = message.campaign_contact_id
        and message.is_from_contact = true
    where campaign_contact.campaign_id = 23
    and campaign_contact.message_status = 'needsMessage'
    group by campaign_contact_id
    order by count(message.id) desc;
  `);

  console.log(results);
  console.log(results.length);

  for (const { campaign_contact_id, message_count } of results) {
    await repairContactState(campaign_contact_id);
  }
}

async function repairContactState(campaign_contact_id) {
  let properMessageStatus;
  const messages = await db("message")
    .where({ campaign_contact_id })
    .orderBy("created_at", "asc");
  if (messages[messages.length - 1].is_from_contact) {
    properMessageStatus = "needsResponse";
  } else {
    properMessageStatus = "convo";
  }
  console.log(
    await db("campaign_contact")
      .where({ id: campaign_contact_id })
      .update({ message_status: properMessageStatus })
  );
}
