require("dotenv").config();
const _ = require("lodash");

const config = {
  client: "mysql",
  connection: process.env.DATABASE_URL,
  pool: {
    min: 2,
    max: 10
  }
};

const db = require("knex")(config);

const fs = require("fs");
const papa = require("papaparse");

// if (process.argv[2]) {

// }

const rows = papa.parse(fs.readFileSync("../DUMP3.csv").toString()).data;

async function fixCsvRow([message_id, new_assignment_id]) {
  int_message_id = parseInt(message_id);
  int_new_assignment_id = parseInt(new_assignment_id);
  if (isNaN(int_message_id) || isNaN(int_new_assignment_id)) {
    console.log({ message_id, new_assignment_id });
    return;
  }
  return await db("message")
    .where({ id: int_message_id })
    .update({ assignment_id: int_new_assignment_id });
}

async function fixRow({ message_id, new_assignment_id }) {
  message_id = parseInt(message_id);
  new_assignment_id = parseInt(new_assignment_id);
  return await db("message")
    .where({ id: message_id })
    .update({ assignment_id: new_assignment_id });
}

function sleep(n) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(true), n * 1000);
  });
}

const previously_seen = new Set();
async function go() {
  const results = await db.raw(`
		SELECT message.id as message_id, campaign_contact.assignment_id as new_assignment_id, campaign_contact.id as cc_id, message.assignment_id as maid
		FROM message JOIN campaign_contact ON campaign_contact.cell = message.contact_number 
		WHERE message.assignment_id != campaign_contact.assignment_id
		LIMIT 1;
	`);

  const rows = results[0];
  console.log(rows[0]);

  const chunks = _.chunk(rows, 1);
  for (const chunk of chunks) {
    chunk.forEach((r) => {
      if (previously_seen.has(r.message_id)) {
        throw new Error(`Duplicate!!! ${r.message_id}`);
      }
      previously_seen.add(r.message_id);
    });
    await Promise.all(chunk.map(fixRow));
    // console.log(chunk);
    console.log(`Did chunk with ${chunk.length}`);
  }

  console.log(`Did ${rows.length}`);
}

async function main(rows) {
  const chunks = _.chunk(rows, 100);
  for (const chunk of chunks) {
    // chunk.forEach(r => {
    // 	if (previously_seen.has(r.message_id)) {
    // 		throw new Error(`Duplicate!!! ${r.message_id}`)
    // 	}
    // 	previously_seen.add(r.message_id)
    // })
    await Promise.all(chunk.map(fixCsvRow));
  }
  // while (true) {
  // 	await go()
  // 	await sleep(0.5)
  // }
}

main(rows).then(console.log).catch(console.error);
