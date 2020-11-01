require("dotenv").config();
const knex = require("knex");
const zipCodeToTimeZone = require("zipcode-to-timezone");
const _ = require("lodash");

const config = {
  client: "postgresql",
  connection: process.env.DATABASE_URL,
  pool: {
    min: process.env.ROW_CONCURRENCY,
    min: process.env.ROW_CONCURRENCY
  }
};

const db = knex(config);
const BATCH_SIZE = 10000;

async function doBatch() {
  console.log("Gettting started...");

  // Index on timezone will make this fast
  const someZipCodesToFill = await db.raw(
    `select distinct(zip) from (
      select zip
      from campaign_contact
      where timezone is null and zip <> ''
      limit ?
    ) some_ccs`,
    [BATCH_SIZE]
  );

  const zips = someZipCodesToFill.rows.map(r => r.zip);
  console.log(`Found ${zips.length} zips`);

  let totalUpdateCount = 0;
  // Run it sequentially to avoid any too large update, which could row level lock
  // This will run 44k times, so it could probably be sped up a bit after a few runs
  const zipChunks = _.chunk(zips, 50);
  for (const zips of zipChunks) {
    await Promise.all(
      zips.map(async zip => {
        const timezone = zipCodeToTimeZone.lookup(zip);
        console.log(timezone);
        const updateCount = await db("campaign_contact")
          .update({ timezone })
          .where({ zip });

        console.log("Updated in batch", updateCount);
        totalUpdateCount += updateCount;
      })
    );
  }

  // if totalUpdateCount > 0, we're not done, so return false
  console.log(`Updated ${totalUpdateCount} in batch`);
  return totalUpdateCount === 0;
}

async function main() {
  let done = false;
  while (!done) {
    done = await doBatch();
  }
}

main()
  .then(console.log)
  .catch(console.error);
