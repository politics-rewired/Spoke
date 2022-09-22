import type { ParserOptionsArgs } from "fast-csv";
import { parse } from "fast-csv";
import type { JobHelpers, Task } from "graphile-worker";
import { fromPairs, toPairs } from "lodash";
import type { PoolClient } from "pg";
import type { SuperAgentRequest } from "superagent";
import { get, post } from "superagent";

import { config } from "../../../config";
import { notifyLargeCampaignEvent } from "../../api/lib/alerts";
import type { VanSecretAuthPayload } from "../../lib/external-systems";
import { withVan } from "../../lib/external-systems";
import { withTransaction } from "../../utils";
import { getVanAuth, handleResult, normalizedPhoneOrNull } from "./lib";

export const TASK_IDENTIFIER = "van-fetch-saved-list";

const BATCH_SIZE = 1000;

enum VanPhoneType {
  Cell = "cell",
  Home = "home",
  Work = "work"
}

type ColumnConfig = {
  [key: string]: string | string[] | { [key: string]: string }[];
};

enum ExportJobStatus {
  Completed = "Completed",
  Requested = "Requested",
  Pending = "Pending",
  Error = "Error"
}

interface ExportJob {
  exportJobId: number;
  exportJobGuid: string;
  savedListId: number;
  webhookUrl: string;
  downloadUrl: string;
  status: ExportJobStatus;
  type: number;
  dateExpired: string;
  errorCode: string | null;
}

interface HustleExportRow {
  CellPhone: "";
  CellPhoneDialingPrefix: "";
  CellPhoneCountryCode: "";
  CellPhoneId: "";
  WorkPhone: "";
  WorkPhoneDialingPrefix: "";
  WorkPhoneCountryCode: "";
  WorkPhoneId: "";
  IsWorkPhoneACellExchange: "";
  Phone: "(555) 768-3292";
  PhoneDialingPrefix: "1";
  PhoneCountryCode: "US";
  PhoneId: "806416";
  HomePhone: "5557683292";
  HomePhoneDialingPrefix: "1";
  HomePhoneCountryCode: "US";
  HomePhoneId: "806416";
  IsHomePhoneACellExchange: "0";
  [key: string]: string | null;
}

const produceSubObjectPair = (
  keyConfig: string | { [key: string]: string },
  row: HustleExportRow
): [string, string] =>
  typeof keyConfig === "string"
    ? [keyConfig, row[keyConfig]!]
    : [Object.keys(keyConfig)[0], row[Object.values(keyConfig)[0]]!];

type OldKey = string | { [key: string]: string };

const transformSubObject = (oldKey: OldKey[], row: HustleExportRow) =>
  oldKey.map<[string, string]>((o) => produceSubObjectPair(o, row));

const transformByColumnConfig = (
  row: HustleExportRow,
  columnConfig: ColumnConfig
) =>
  fromPairs(
    toPairs(columnConfig).map(([newKey, oldKey]) =>
      Array.isArray(oldKey)
        ? [newKey, fromPairs(transformSubObject(oldKey, row))]
        : [newKey, row[oldKey]]
    )
  );

const maybeExtractPhoneType = (
  r: HustleExportRow,
  extract_phone_type: VanPhoneType | null
) => {
  if (extract_phone_type === null || extract_phone_type === undefined) {
    return r;
  }

  const phoneOpts = [
    [
      r.CellPhoneDialingPrefix + r.CellPhone,
      r.CellPhoneId,
      "1",
      VanPhoneType.Cell
    ],
    [
      r.HomePhoneDialingPrefix + r.HomePhone,
      r.HomePhoneId,
      r.IsHomePhoneACellExchange,
      VanPhoneType.Home
    ],
    [
      r.WorkPhoneDialingPrefix + r.WorkPhone,
      r.WorkPhoneId,
      r.IsWorkPhoneACellExchange,
      VanPhoneType.Work
    ],
    [r.PhoneDialingPrefix + r.PhoneCountryCode, r.PhoneId, "0", null]
  ];

  // Try to return the desired one
  for (const opt of phoneOpts) {
    const [number, phoneId, cellExchangeBit, phoneType] = opt;
    if (
      number !== "" &&
      extract_phone_type === VanPhoneType.Cell &&
      (phoneType === VanPhoneType.Cell || cellExchangeBit === "1")
    ) {
      return {
        [extract_phone_type]: normalizedPhoneOrNull(number),
        phone_id: phoneId
      };
    }

    if (number !== "" && extract_phone_type === phoneType) {
      return {
        [extract_phone_type]: normalizedPhoneOrNull(number),
        phone_id: phoneId
      };
    }
  }

  // Return any
  for (const opt of phoneOpts) {
    const [number, phoneId] = opt;
    if (number !== "") {
      return {
        [extract_phone_type]: normalizedPhoneOrNull(number),
        phone_id: phoneId
      };
    }
  }

  return {
    [extract_phone_type]: null,
    phone_id: null
  };
};

interface FetchSavedListsPayload extends VanSecretAuthPayload {
  saved_list_id: number;
  handler: string;
  row_merge: any;
  column_config: ColumnConfig;
  first_n_rows: number;
  extract_phone_type: VanPhoneType | null;
  __context: {
    campaign_id: number;
  };
}

export const fetchSavedList: Task = async (
  payload: FetchSavedListsPayload,
  helpers: JobHelpers
) => {
  const auth = await getVanAuth(helpers, payload);

  const response = await post("/exportJobs").use(withVan(auth)).send({
    savedListId: payload.saved_list_id,
    type: config.VAN_EXPORT_TYPE,
    webhookUrl: config.EXPORT_JOB_WEBHOOK
  });

  const exportJob: ExportJob = response.body;

  if (exportJob.status !== ExportJobStatus.Completed) {
    throw new Error("VAN Export Job status was not 'completed'");
  }

  const options: ParserOptionsArgs = {
    headers: true,
    trim: true,
    maxRows: payload.first_n_rows
  };

  const csvStream = parse(options).transform((row: HustleExportRow) =>
    Object.assign(
      transformByColumnConfig(
        {
          ...row,
          ...maybeExtractPhoneType(row, payload.extract_phone_type)
        },
        payload.column_config
      ),
      payload.row_merge
    )
  );

  let downloadReq: SuperAgentRequest;
  try {
    downloadReq = get(exportJob.downloadUrl);
  } catch (err: any) {
    helpers.logger.error(`Error streaming VAN download: ${err.message}`, {
      exportJob,
      error: err
    });
    throw err;
  }

  downloadReq.pipe(csvStream);

  await helpers.withPgClient(async (client: PoolClient) => {
    await withTransaction(client, async (trx) => {
      let accumulator: any[] = [];

      const flushBatch = (batch: any[]) => {
        const asJsonString = JSON.stringify(batch);
        return trx.query(`select ${payload.handler}($1::json)`, [asJsonString]);
      };

      for await (const row of csvStream) {
        accumulator.push(row);

        if (accumulator.length === BATCH_SIZE) {
          const batchToFlush = accumulator.slice();
          accumulator = [];
          await flushBatch(batchToFlush);
        }
      }

      await flushBatch(accumulator);
    });
  });

  await handleResult(helpers, payload, {});

  await notifyLargeCampaignEvent(payload.__context.campaign_id, "upload");
};
