require("dotenv").config();

const config = {
  client: "mysql",
  connection: process.env.DATABASE_URL,
  pool: {
    min: 2,
    max: 10
  }
};

const _ = require("lodash");
const db = require("knex")(config);

const badIds = [323883, 1045760, 122051, 330250, 330317, 325158];

// WHERE campaign_contact.id
// NOT IN (${badIds.join(', ')})

/* Returns a list of n campaign contact duplicate pairs / trios */
async function getNDuplicates(n) {
  const res = await db.raw(`
        SELECT campaign_contact.id,
          campaign_contact.cell,
          campaign_contact.message_status,
          campaign_contact.campaign_id
        FROM campaign_contact
        INNER JOIN (
                SELECT cell
                FROM campaign_contact
                    GROUP BY cell
                    HAVING count(cell) > 1
                      AND SUM(
                        CASE 
                          WHEN message_status = 'needsMessage'
                          THEN 1
                          ELSE 0
                        END
                      ) > 0
                    -- LIMIT ${n}
            ) dup
            ON campaign_contact.cell = dup.cell;
    `);
  const rows = res[0];
  console.log(rows.length);
  return _.groupBy(rows, "cell");
}

/* Returns a list of campaign contacts with number `number` */
async function getContactsWithNumber(number) {
  const cells = await db("campaign_contact")
    .where({ cell: number })
    .pluck("cell");
  return cells;
}

/* Deletes a list of campaign contacts */
async function deleteCampaignContacts(toDelete) {
  // console.log(`Would delete: ${JSON.stringify(toDelete.map(cc => cc.id))}`)
  // return true
  try {
    const updatedToDelete = [];
    for (const cc of toDelete) {
      if (!badIds.includes(cc.id)) {
        updatedToDelete.push(cc.id);
      }
    }

    // const updatedToDelete = toDelete.map(cc => cc.id).filter(id => !badIds.includes(id))
    const deleteResult = await db("campaign_contact")
      .whereIn("id", updatedToDelete)
      .del();
  } catch (error) {
    const failedId = error.sql
      .split(" ")
      .reverse()[0]
      .split("(")[1]
      .split(")")[0];
    badIds.push(parseInt(failedId));
    console.log(`Got bad ID: ${parseInt(failedId)}`);
    console.log(`We now have ${badIds.length} bad ids`);
  }
  // console.log({ deleteResult })
  return true;
}

const BATCH_SIZE = 1000;
let done = 1;
async function main() {
  const listOfDuplicates = await getNDuplicates(BATCH_SIZE);
  // console.log(listOfDuplicates)
  // for (let phone of Object.keys(listOfDuplicates)) {

  await Promise.all(
    Object.keys(listOfDuplicates).map(async phone => {
      const duplicates = listOfDuplicates[phone];
      const hasReceivedMessage =
        duplicates.filter(cc => cc.message_status !== "needsMessage").length >
        0;
      // console.log({ hasReceivedMessage })
      if (hasReceivedMessage) {
        const toDelete = duplicates.filter(
          cc => cc.message_status == "needsMessage"
        );
        await deleteCampaignContacts(toDelete);
      } else {
        const sortedByCampaignId = _.sortBy(duplicates, cc => cc.campaign_id);
        const toKeep = sortedByCampaignId[0];
        // console.log(`Would keep: ${JSON.stringify(toKeep)}`)
        const toDelete = sortedByCampaignId.slice(1, 10000);
        await deleteCampaignContacts(toDelete);
      }
    })
  );

  console.log(`Did ${done * BATCH_SIZE}`);
  done++;

  if (listOfDuplicates.length == 0) {
    process.exit();
  } else {
    return await main();
  }
  // }
}

// main()
//   .then(() => process.exit(0))
//   .catch(error => {
//     console.error(error);
//     process.exit(1);
//   });

async function go() {
  const sql = `
    SELECT campaign_contact.id
    FROM campaign_contact
    WHERE campaign_contact.campaign_id = 69
      AND campaign_contact.cell IN (
        SELECT cell
        FROM campaign_contact
        WHERE campaign_contact.campaign_id = 68
      )
  `;
  const [ids, _] = await db.raw(sql);
  const actualIds = ids.map(elem => elem.id);
  const result = await db("campaign_contact")
    .where({ campaign_id: 69 })
    .whereIn("id", actualIds)
    .del();
  console.log(result);
}

go()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

// Psuedocode
/*
for phone_number in (select phone_number from campaign_contact where group by phone_number count > 1):
  contacts = get all contacts with phone number `number`
  hasRecievedMessage = (filter by contacts where status != needsMessage).length > 0
  if (hasReceivedMessage)
    unsent campaign contacts = filter contacts where campaign_contact = needsMessage
    delete all unsent campaign contacts
  else
    select one contact to keep, the one with the lowest campaign id
    delete others
*/
