require("dotenv").config();
const _ = require("lodash");
const knex = require("knex");

const config = {
  client: "postgresql",
  connection: process.env.DATABASE_URL,
  pool: {
    min: process.env.ROW_CONCURRENCY,
    min: process.env.ROW_CONCURRENCY
  }
};

const db = knex(config);
const BATCH_SIZE = 20000;

const getMessagingServiceSIDs = () => {
  // Gather multiple messaging service SIDs (may be split across multiple env vars)
  const envVarKeys = Object.keys(process.env).filter((key) =>
    key.startsWith(`TWILIO_MESSAGE_SERVICE_SIDS`)
  );
  envVarKeys.sort();

  let messagingServiceIds = [];
  for (const envVarKey of envVarKeys) {
    const envVarValue = process.env[envVarKey];
    const newServiceIds = envVarValue
      .split(",")
      .map((serviceSid) => serviceSid.trim());
    messagingServiceIds = messagingServiceIds.concat(newServiceIds);
  }

  return messagingServiceIds;
};

const MESSAGING_SERVICE_SIDS = getMessagingServiceSIDs();

const getMessageServiceSID = (cell) => {
  // Check for single message service
  if (process.env.TWILIO_MESSAGE_SERVICE_SID) {
    return process.env.TWILIO_MESSAGE_SERVICE_SID;
  }

  const messagingServiceIndex = deterministicIntWithinRange(
    cell,
    MESSAGING_SERVICE_SIDS.length
  );

  const messagingServiceId = MESSAGING_SERVICE_SIDS[messagingServiceIndex];

  if (!messagingServiceId)
    throw new Error(`Could not find Twilio message service SID for ${cell}!`);

  return messagingServiceId;
};

function deterministicIntWithinRange(string, maxSize) {
  const hash = hashStr(string);
  const index = hash % maxSize;
  return index;
}

function hashStr(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    const charCode = str.charCodeAt(i);
    hash += charCode;
  }
  return hash;
}

const doBatch = async () => {
  const { rows } = await db.raw(
    //   `
    //   select campaign_contact.cell
    //   from campaign_contact
    //   left join messaging_service_stick
    //     on messaging_service_stick.cell = campaign_contact.cell
    //   where messaging_service_stick.messaging_service_sid is null
    //   limit ${BATCH_SIZE}
    // `
    `
    select distinct campaign_contact.cell
    from campaign_contact
    where not exists (
      select 1
      from messaging_service_stick
      where messaging_service_stick.cell = campaign_contact.cell
    )
    limit ${BATCH_SIZE};
    `
  );

  // Deduping a batch of 5000 in Javascript is way faaster than adding the distinct
  const cells = [...new Set(rows.map((r) => r.cell))];

  console.log("Doing ", cells.length);

  if (cells.length === 0) {
    return 0;
  }

  const toInsert = cells.map((c) => ({
    cell: c,
    organization_id: 1,
    messaging_service_sid: getMessageServiceSID(c)
  }));

  await db("messaging_service_stick").insert(toInsert);

  console.log("Did ", cells.length);

  return cells.length;
};

async function main() {
  let done = 0;
  let did = 0;
  while ((did = await doBatch()) > 0) {
    console.log("Did ", did);
    done += did;
    console.log("Done ", done);
  }

  for (const c of campaigns) {
    console.log("Doing campaign: ", c.id);
    await ensureAllNumbersHaveMessagingServiceSIDs(c.id, 1);
    console.log("...done");
  }
}

main().then(console.log).catch(console.error);
