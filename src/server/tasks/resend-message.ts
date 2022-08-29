/* eslint-disable import/prefer-default-export */
import type { Task } from "pg-compose";

import { sendMessage } from "../api/lib/assemble-numbers";
import type { SendMessagePayload } from "../api/lib/types";

/*
To create these jobs, run:

select graphile_worker.add_job(
  'resend-message',
  row_to_json(jobs)
)
from (
  select
    m.id,
    m.user_id,
    m.campaign_contact_id,
    m.text,
    m.contact_number,
    m.assignment_id,
    m.send_status,
    m.service,
    m.is_from_contact,
    m.queued_at,
    m.send_before, -- maybe change
    m.script_version_hash,
    c.organization_id
  from message m
  join campaign_contact cc on cc.id = m.campaign_contact_id
  join campaign c on cc.campaign_id = c.id
  where -- your custom requeue where clauses here
) jobs

*/

type ResendMessagePayload = { organization_id: number } & SendMessagePayload;

export const resendMessage: Task = async (payload, _helpers) => {
  const {
    organization_id,
    ...sendMessagePayload
  } = payload as ResendMessagePayload;

  await sendMessage(sendMessagePayload, organization_id);
};
