import { makeNumbersClient } from "../lib/assemble-numbers";
import { addProgressJob, ProgressJobPayload, ProgressTask } from "./utils";

export const TASK_IDENTIFIER = "filter-landlines";

const LRN_BATCH_SIZE = 1000;

interface FilterRow {
  id: number;
  cell: string;
}

export const filterLandlines: ProgressTask<ProgressJobPayload> = async (
  payload,
  helpers
) => {
  const { campaignId } = payload;

  const {
    rows: [{ features }]
  } = await helpers.query(
    `
      select features
      from organization
      join campaign on campaign.organization_id = organization.id
      where campaign.id = $1
    `,
    [campaignId]
  );

  const orgFeatures = JSON.parse(features || "{}");

  const { numbersApiKey } = orgFeatures;

  if (!numbersApiKey) {
    throw new Error("Cannot filter landlines - no numbers api key configured");
  }

  const numbersClient = makeNumbersClient({ apiKey: numbersApiKey });
  const numbersRequest = await numbersClient.lookup.createRequest();

  let highestId = 0;
  let nextBatch: FilterRow[] = [];

  do {
    const result = await helpers.query<FilterRow>(
      `
        select id, cell
        from campaign_contact
        where
          campaign_id = $1
          and id > $2
        order by id asc
        limit $3
      `,
      [campaignId, highestId, LRN_BATCH_SIZE]
    );

    nextBatch = result.rows;

    if (nextBatch.length > 0) {
      highestId = nextBatch[nextBatch.length - 1].id;
      const batchCells = nextBatch.map((cc) => cc.cell);
      await numbersRequest.addPhoneNumbers(batchCells as any);
    }
  } while (nextBatch.length > 0);

  await numbersRequest.close();

  await numbersRequest.waitUntilDone({
    onProgressUpdate: async (percentComplete) => {
      await helpers.updateStatus(Math.round(percentComplete * 100));
    }
  });

  let landlinesFilteredOut = 0;

  const deleteNumbers = async (numbers: { phoneNumber: string }[]) => {
    landlinesFilteredOut += numbers.length;
    await helpers.query(
      `
        delete from campaign_contact
        where
          campaign_id = $1
          and cell = any ($2)
      `,
      [campaignId, numbers.map((n) => n.phoneNumber)]
    );
  };

  await numbersRequest.landlines.eachPage({
    onPage: deleteNumbers
  });

  await numbersRequest.invalids.eachPage({
    onPage: deleteNumbers
  });

  // Setting result_message marks the job as complete
  await Promise.all([
    helpers.updateResult({
      message: `${landlinesFilteredOut} contacts removed because they were landlines or invalid`
    }),
    helpers.query(
      `
        update campaign
        set landlines_filtered = true
        where id = $1
      `,
      [campaignId]
    )
  ]);
};

export const addFilterLandlines = async (payload: ProgressJobPayload) =>
  addProgressJob({
    identifier: TASK_IDENTIFIER,
    payload
  });
