import { format } from "fast-csv";
import type { JobHelpers } from "graphile-worker";
import DateTime from "src/lib/datetime";
import { getDownloadUrl, getUploadStream } from "src/workers/exports/upload";

import sendEmail from "../mail";
import { r } from "../models";
import { errToObj } from "../utils";

export const TASK_IDENTIFIER = "export-opt-outs";

interface ExportOptOutsPayload {
  campaignIds?: Array<string>;
  requesterEmail: string;
}

export const exportOptOuts = async (
  { campaignIds, requesterEmail }: ExportOptOutsPayload,
  helpers: JobHelpers
) => {
  let campaignIdsCondition = "";
  let campaignIdsParsed: Array<string> | undefined =
    campaignIds?.filter((c) => c !== "-1") ?? [];

  if (campaignIdsParsed?.length > 0) {
    campaignIdsCondition = "WHERE c.id = ANY(:campaignIdsParsed)";
    if (campaignIds?.includes("-1")) {
      campaignIdsCondition = campaignIdsCondition.concat(" OR c.id IS NULL");
    }
  } else {
    // Array is empty, mark it as nil so that binding below
    // doesn't complain about not finding a binding
    campaignIdsParsed = undefined;
    if (campaignIds?.includes("-1")) {
      campaignIdsCondition = "WHERE c.id IS NULL";
    }
  }
  const { rows: optOuts } = await r.knex.raw(
    `
        SELECT opt_out.cell,
            cc.first_name, 
            cc.last_name, 
            cc.external_id, 
            c.title as campaign_name, 
            o.name as organization_name
        FROM opt_out
        LEFT JOIN campaign_contact cc 
        ON cc.cell = opt_out.cell 
            AND cc.assignment_id = opt_out.assignment_id
        LEFT JOIN all_campaign c
        ON c.id = cc.campaign_id
        LEFT JOIN organization o 
        ON o.id = c.organization_id
        ${campaignIdsCondition}
    `,
    { campaignIdsParsed }
  );

  const exportTimestamp = DateTime.local().toFormat("y-mm-d-hh-mm-ss");
  const fileName = `optOutsExport-${exportTimestamp}.csv`;

  const optOutsUploadStream = await getUploadStream(fileName);
  const optOutsWriteStream = format({ headers: true, writeHeaders: true });

  optOutsUploadStream.on("error", (error) => {
    helpers.logger.error("error in optOutsUploadStream:", errToObj(error));
  });

  optOutsWriteStream.on("error", (error) => {
    helpers.logger.error("error in optOutsWriteStream:", errToObj(error));
  });

  const optOutsUploadPromise = new Promise((resolve) => {
    optOutsUploadStream.on("finish", resolve);
  });

  optOutsWriteStream.pipe(optOutsUploadStream);

  for (const optOut of optOuts) {
    optOutsWriteStream.write(optOut);
  }

  helpers.logger.debug("Waiting for upload to finish");

  optOutsWriteStream.end();
  await optOutsUploadPromise;
  const fileUploadedUrl = await getDownloadUrl(fileName);

  await sendEmail({
    to: requesterEmail,
    subject: `Opts Out Export Ready`,
    text: `Your opt outs export is ready. You can download it from here: ${fileUploadedUrl}`
  });

  helpers.logger.info("Finished exporting opt outs");
};
