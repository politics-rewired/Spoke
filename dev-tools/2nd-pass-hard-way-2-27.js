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

/*
0 = ensure that all texts in the ben assignment pool are the ones to move over (piece of paper)

1 = update campaign_contact
    set campaign_id = 12?
      where messate_status = 'messaged'
      AND campaign_id = 69
      and assignment_id = [ben's 69 assignment]

2. update assignment
    set campaign_id = 12?
    where id = 
    ben's 69 assignment]

3. Repeat 1/2 for other campaign
  
4. change releaseUnsentMessages to also release the messages
5. release them
*/

// resetCCMessageStatus({ campaignId: 66, assignmentId: 6145 })
resetCCMessageStatus({ campaignId: 69, assignmentId: 5656 })
  .then(console.log)
  .catch(console.error);

async function resetCCMessageStatus({ campaignId, assignmentId }) {
  const [ccs_assigned_to_ben_with_a_reply, _junk] = await db.raw(`
    select id from campaign_contact
    where campaign_id = ${campaignId}
    and assignment_id = ${assignmentId}
    and message_status = 'messaged'
    and id in (
      select campaign_contact_id from message
      where message.is_from_contact = true
    )
  `);

  for (const cc of ccs_assigned_to_ben_with_a_reply) {
    await properlyMarkCampaignContact(cc);
  }

  return ccs_assigned_to_ben_with_a_reply;
}

async function properlyMarkCampaignContact(cc) {
  let properMessageStatus;
  const messages = await db("message")
    .where({ campaign_contact_id: cc.id })
    .orderBy("created_at", "asc");
  if (messages[messages.length - 1].is_from_contact) {
    properMessageStatus = "needsResponse";
  } else {
    properMessageStatus = "convo";
  }

  // console.log(messages)
  // console.log(properMessageStatus)
  console.log(
    await db("campaign_contact")
      .where({ id: cc.id })
      .update({ message_status: properMessageStatus })
  );
}
