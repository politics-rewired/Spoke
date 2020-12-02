import chunk from "lodash/chunk";

import { r } from "../src/server/models";
import { exportCampaign } from "../src/server/tasks/export-campaign";

require("dotenv").config();

const ARCHIVED_CAMPAIGN_AGE_DAYS = 14;
const CAMPAIGN_FETCH_CHUNK_SIZE = 1000;
const EXPORT_CHUNK_SIZE = 4;
const { NOTIFY_USER_ID } = process.env;

const jobPayload = (campaignId) => ({
  queue_name: `${campaignId}:export`,
  job_type: "export",
  locks_queue: false,
  assigned: true,
  campaign_id: campaignId,
  payload: JSON.stringify({
    campaignId,
    requester: NOTIFY_USER_ID,
    isAutomatedExport: true
  })
});

const main = async (lastId) => {
  console.log(
    `Looking for next ${CAMPAIGN_FETCH_CHUNK_SIZE} campaign IDs after ID ${lastId}...`
  );

  const campaignIds = await r
    .knex("campaign")
    .whereRaw(process.argv[2])
    .where("id", ">", lastId)
    .limit(CAMPAIGN_FETCH_CHUNK_SIZE)
    .orderBy("id")
    .pluck("id");

  if (campaignIds.length === 0) {
    console.log("Hit the end of the exports");
    return;
  }

  console.log(
    `Found ${campaignIds.length} campaign IDs after ID ${lastId}. Exporting...`
  );

  const campaignIdChunks = chunk(campaignIds, EXPORT_CHUNK_SIZE);
  for (const campaignIds of campaignIdChunks) {
    await Promise.all(
      campaignIds.map(async (campaignId) =>
        r
          .knex("job_request")
          .insert(jobPayload(campaignId))
          .returning("*")
          .then(([job]) => exportCampaign(job))
      )
    );
  }

  return main(campaignIds[campaignIds.length - 1]);
};

main(0)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
