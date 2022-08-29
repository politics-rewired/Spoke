import type { Task } from "pg-compose";

import { processDeliveryReportBody as processAssembleDeliveryReport } from "../api/lib/assemble-numbers";
import { processDeliveryReportBody as processTwilioDeliveryReport } from "../api/lib/twilio";
import type { LogRecord } from "../api/types";
import { MessagingServiceType } from "../api/types";
import { withTransaction } from "../utils";

export const handleDeliveryReport: Task = async (
  payload: LogRecord,
  helpers
) => {
  const { id: logId, service_type, body: stringBody } = payload;
  const body = JSON.parse(stringBody || "");

  await helpers.withPgClient((client) =>
    withTransaction(client, async (trx) => {
      if (service_type === MessagingServiceType.AssembleNumbers) {
        await processAssembleDeliveryReport(trx, body);
      } else if (service_type === MessagingServiceType.Twilio) {
        await processTwilioDeliveryReport(trx, body);
      } else {
        throw new Error(`Unknown service type ${service_type}`);
      }

      await trx.query(`delete from log where id = $1`, [logId]);
    })
  );
};

export default handleDeliveryReport;
