import Knex from "knex";
import Papa from "papaparse";
import moment from "moment";

import { JobRequestRecord } from "../../server/api/types";
import { r } from "../../server/models";
import { sendEmail } from "../../server/mail";
import logger from "../../logger";
import { errToObj } from "../../server/utils";
import { deleteJob } from "./index";
import { uploadToCloud } from "../exports/upload";

export interface ExportForVANOptions {
  requesterId: number;
  vanIdField: string;
  includeUnmessaged: boolean;
}

interface VanExportRow {
  campaign_contact_id: number;
  VAN_ID: string;
  cell: string;
  first_name: string;
  last_name: string;
  value: string;
  date: string;
}

const CHUNK_SIZE = 1000;
const FILTER_MESSAGED_FRAGMENT = `and exists ( select 1 from message where campaign_contact_id = cc.id)`;

export const exportForVan = async (job: JobRequestRecord) => {
  const reader: Knex = r.reader;
  const payload: ExportForVANOptions = JSON.parse(job.payload);
  const { requesterId, includeUnmessaged, vanIdField } = payload;

  const { email } = await reader("user")
    .where({ id: requesterId })
    .first(["email"]);
  const { title } = await reader("campaign")
    .where({ id: job.campaign_id })
    .first(["title"]);

  const vanIdSelector =
    vanIdField === "external_id"
      ? "cc.external_id"
      : `(cc.custom_fields::json)->>'${vanIdField}'`;

  const fetchChunk = async (lastContactId: number) => {
    const { rows } = await reader.raw<{ rows: VanExportRow[] }>(
      `
        with campaign_contact_ids as (
          select
            id,
            cell,
            first_name,
            last_name,
            ${vanIdSelector} as VAN_ID
          from campaign_contact cc
          where
            campaign_id = ?
            and id > ?
            ${includeUnmessaged ? "" : FILTER_MESSAGED_FRAGMENT}
          order by id asc
          limit ?
        )
        select
          distinct on (cc.VAN_ID) VAN_ID,
          cc.id as campaign_contact_id,
          cc.cell,
          cc.first_name,
          cc.last_name,
          (case
            when aqr.value is null then 'canvassed, no response'
            else aqr.value
          end) as value,
          to_char(aqr.created_at,'MM-DD-YYYY') as date
        from campaign_contact_ids cc
        left join all_question_response aqr on cc.id = aqr.campaign_contact_id
        order by cell
      `,
      [job.campaign_id, lastContactId, CHUNK_SIZE]
    );

    return rows;
  };

  let exportRows: Omit<VanExportRow, "campaign_contact_id">[] = [];
  let lastContactId = 0;
  do {
    const rows = await fetchChunk(lastContactId);
    exportRows = exportRows.concat(
      rows.map(({ campaign_contact_id, ...rest }) => rest)
    );

    lastContactId =
      rows.length > 0 ? rows[rows.length - 1].campaign_contact_id : -1;
  } while (lastContactId > 0);

  const exportCsv = Papa.unparse(exportRows);

  const safeTitle = title.replace(/ /g, "_").replace(/\//g, "_");
  const timestamp = moment().format("YYYY-MM-DD-HH-mm-ss");
  const vanExpostKey = `${safeTitle}-${timestamp}.csv`;
  const exportUrl = await uploadToCloud(`${vanExpostKey}.csv`, exportCsv);

  await sendEmail({
    to: email,
    subject: `VAN export ready for ${title}`,
    text: `Your VAN exports is ready! This URL will be valid for 24 hours.\n\n${exportUrl}`
  }).catch((err: Error) => {
    logger.error("Error sending VAN export email", {
      ...errToObj(err),
      exportUrl
    });
  });

  await deleteJob(job.id);
};
