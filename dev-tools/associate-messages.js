const moment = require("moment");

const config = {
  client: "mysql",
  connection: process.env.DATABASE_URL,
  pool: {
    min: 2,
    max: 30
  }
};

const db = require("knex")(config);

const prettyPrint = (obj) => JSON.stringify(obj, null, 2);
const BATCH_SIZE = 10000;

let amountDone = 0;
let lastId = 0;

main().then(console.log).catch(console.error);
const IGNORE = [];

async function main() {
  const messages = await db("message")
    .whereNull("campaign_contact_id")
    .where("id", ">", lastId)
    // .where('queued_at', '>', "2019-02-19T21:02:31.000Z")
    .limit(BATCH_SIZE);

  lastId = messages[messages.length - 1].id;

  if (messages.length == 0) {
    console.log("Fully done!");
    process.exit();
  }

  await Promise.all(
    messages.map(async (message) => {
      try {
        await associateMessage(message);
      } catch (ex) {
        // console.error(ex)
      }
    })
  );

  amountDone += messages.length;
  console.log(`Did ${amountDone}`);

  return main();
}

async function associateMessage(message) {
  const matchingCampaignContact = await findMatchingCampaignContact(message);
  const update = await db("message")
    .where({ id: message.id })
    .update({ campaign_contact_id: matchingCampaignContact.id });
  return update;
}

async function findMatchingCampaignContact(message) {
  // console.log(`\n\nDoing ${message.id}\n\n`)
  const campaign_contacts = await db("campaign_contact").where({
    cell: message.contact_number
  });
  const with_same_assignment_id = campaign_contacts.filter(
    (cc) => cc.assignment_id == message.assignment_id
  );

  let selection;
  try {
    selection = await selectCampaignContact(
      message,
      with_same_assignment_id,
      "SAME ASSIGNMENT"
    );
  } catch (ex) {
    // console.log('Looking for other assignment ids')
    selection = await selectCampaignContact(
      message,
      campaign_contacts,
      "ALL ASSIGNMENTS"
    );
  }

  return selection;
}

async function selectCampaignContact(message, options, mode) {
  if (options.length == 1) {
    return options[0];
  }
  const created_before_message = options.filter((cc) => {
    const message_created_at = moment(message.created_at);
    const cc_created_at = moment(cc.created_at);
    // console.log({ message_created_at, cc_created_at })
    return cc_created_at.isBefore(message_created_at);
  });

  if (created_before_message.length == 1) {
    return created_before_message[0];
  }
  if (created_before_message.length == 0) {
    throw new Error(`Could not associate message with campaign contact in mode ${mode}: ${prettyPrint(
      message
    )}.
        Options were all too late: ${prettyPrint(options)}`);
  } else {
    return created_before_message[0];
    // throw new Error(`Multiple options for associations in mode ${mode} with message ${prettyPrint(message)}: options are ${prettyPrint(created_before_message)}`)
  }
}
