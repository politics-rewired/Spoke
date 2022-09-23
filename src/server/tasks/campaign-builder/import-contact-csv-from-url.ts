import type { ParserOptionsArgs } from "fast-csv";
import { parse } from "fast-csv";
import type { JobHelpers, Task } from "graphile-worker";
import omit from "lodash/omit";
import type { PoolClient } from "pg";
import Pgp from "pg-promise";
import type { SuperAgentRequest } from "superagent";
import superagent from "superagent";
import zipCodeToTimeZone from "zipcode-to-timezone";

import { notifyLargeCampaignEvent } from "../../api/lib/alerts";
import {
  deleteOptedOutContacts,
  getContactResultMessage,
  getValidatedData
} from "../../api/lib/contact-list";
import type { CampaignContactRecord } from "../../api/types";
import { withTransaction } from "../../utils";

export const TASK_IDENTIFIER = "import-contact-csv-from-url";

const pgp = Pgp({});
const cs = new pgp.helpers.ColumnSet(
  [
    "campaign_id",
    "first_name",
    "last_name",
    "cell",
    "external_id",
    "zip",
    "custom_fields"
  ],
  {
    table: "campaign_contact"
  }
);

type CampaignContactInsertRow = Pick<
  CampaignContactRecord,
  | "campaign_id"
  | "first_name"
  | "last_name"
  | "cell"
  | "external_id"
  | "zip"
  | "custom_fields"
  | "timezone"
>;

type ColumnMapping = {
  firstName: string;
  lastName?: string;
  cell: string;
  externalId?: string;
  zip?: string;
};

const transformRowFactory = (
  campaignId: number,
  columnMapping: ColumnMapping
) => (row: any): CampaignContactInsertRow => {
  const namedFields: string[] = [
    columnMapping.firstName,
    columnMapping.lastName,
    columnMapping.cell,
    columnMapping.externalId,
    columnMapping.zip
  ].filter<string>((col): col is string => col !== undefined);

  const customFields = omit(row, namedFields);
  const zip = columnMapping.zip ? row[columnMapping.zip] : null;

  return {
    campaign_id: campaignId,
    first_name: row[columnMapping.firstName],
    last_name: columnMapping.lastName ? row[columnMapping.lastName] : null,
    cell: row[columnMapping.cell],
    external_id: columnMapping.externalId
      ? row[columnMapping.externalId]
      : null,
    zip,
    timezone: zip ? zipCodeToTimeZone.lookup(zip) : null,
    custom_fields: JSON.stringify(customFields)
  };
};

const insertBatch = (trx: PoolClient, batch: CampaignContactInsertRow[]) => {
  const query = pgp.helpers.insert(batch, cs);
  return trx.query(query);
};

export interface ImportContactCsvFromUrlPayload {
  campaignId: number;
  signedDownloadUrl: string;
  columnMapping: ColumnMapping;
}

export const importContactCsvFromUrl: Task = async (
  payload: ImportContactCsvFromUrlPayload,
  helpers: JobHelpers
) => {
  const { campaignId, signedDownloadUrl, columnMapping } = payload;

  const options: ParserOptionsArgs = {
    headers: true,
    trim: true
  };

  const transformRow = transformRowFactory(campaignId, columnMapping);
  const csvStream = parse<any, CampaignContactInsertRow>(options).transform(
    transformRow
  );

  let downloadReq: SuperAgentRequest;
  try {
    downloadReq = superagent.get(signedDownloadUrl);
  } catch (err: any) {
    helpers.logger.error(
      `Error streaming contact CSV download: ${err.message}`,
      { payload, error: err }
    );
    throw err;
  }

  downloadReq.pipe(csvStream);

  await helpers.withPgClient(async (client) => {
    const {
      rows: [{ id: jobId }]
    } = await client.query<{ id: string }>(
      `
        insert into job_request (
          queue_name,
          job_type,
          locks_queue,
          payload,
          assigned,
          campaign_id
        ) values (
          $1,
          'upload_contacts',
          true,
          '{}',
          true,
          $2
        )
        returning id
      `,
      [`${campaignId}:edit_campaign`, campaignId]
    );

    await withTransaction(client, async (trx) => {
      await trx.query(
        `update campaign set external_system_id = null, landlines_filtered = false where id = $1`,
        [campaignId]
      );
      await trx.query(`delete from campaign_contact where campaign_id = $1`, [
        campaignId
      ]);

      const accumulator: CampaignContactInsertRow[] = [];
      for await (const row of csvStream) {
        accumulator.push(row);
      }

      const { validationStats, validatedData } = getValidatedData(
        accumulator,
        []
      );

      await insertBatch(trx, validatedData);

      const optOutCount = await deleteOptedOutContacts(trx, campaignId);

      const jobMessages = await getContactResultMessage({
        ...validationStats,
        optOutCount
      });

      // Always set a result message to mark the job as complete
      const message =
        jobMessages.length > 0
          ? jobMessages.join("\n")
          : "Contact upload successful.";

      await trx.query(
        `update job_request set result_message = $1 where id = $2`,
        [message, jobId]
      );
    });
  });

  await notifyLargeCampaignEvent(campaignId, "upload");
};
