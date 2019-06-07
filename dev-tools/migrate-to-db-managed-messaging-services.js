require("dotenv").config();
const _ = require("lodash");
const knex = require("knex");

const config = {
  client: "postgresql",
  connection: process.env.DATABASE_URL,
  pool: {
    min: process.env.ROW_CONCURRENCY,
    min: process.env.ROW_CONCURRENCY,
  }
};

const db = knex(config);
const BATCH_SIZE = 5000;

const getMessagingServiceSIDs = () => {
  // Gather multiple messaging service SIDs (may be split across multiple env vars)
  const envVarKeys = Object.keys(process.env).filter(key =>
    key.startsWith(`TWILIO_MESSAGE_SERVICE_SIDS`)
  );
  envVarKeys.sort();

  let messagingServiceIds = [];
  for (const envVarKey of envVarKeys) {
    const envVarValue = process.env[envVarKey];
    const newServiceIds = envVarValue
      .split(",")
      .map(serviceSid => serviceSid.trim());
    messagingServiceIds = messagingServiceIds.concat(newServiceIds);
  }

  return messagingServiceIds;
};

const MESSAGING_SERVICE_SIDS = getMessagingServiceSIDs();

const getMessageServiceSID = cell => {
  // Check for single message service
  if (!!process.env.TWILIO_MESSAGE_SERVICE_SID) {
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

const doBatch = async () => {
  const { rows } = await knex.raw(
    `
    select distinct campaign_contact.cell
    from campaign_contact
    left join messaging_service_stick
      on messaging_service_stick.cell = campaign_contact.cell
    where messaging_service_stick.messaging_service_sid is null
    limit ${BATCH_SIZE}
  `,
    [organizationId, campaignId]
  );

  const cells = rows.map(r => r.cell);

  console.log("Doing ", cells.length);

  if (cells.length === 0) {
    return 0;
  }

  const toInsert = cells.map(c => ({
    cell: c,
    organization_id: 1,
    messaging_service_sid: getMessageServiceSID(c)
  }));

  await knex("messaging_service_stick").insert(toInsert);

  console.log("Did ", cells.length);

  return cells.length;
};

async function main() {
  let done = 0;
  let did = 0;
  while ((did = await doBatch())) {
    console.log("Did ", did);
    done = done + did;
    connsole.log("Done ", done);
  }

  for (let c of campaigns) {
    console.log("Doing campaign: ", c.id);
    await ensureAllNumbersHaveMessagingServiceSIDs(c.id, 1);
    console.log("...done");
  }
}

main()
  .then(console.log)
  .catch(console.error);
