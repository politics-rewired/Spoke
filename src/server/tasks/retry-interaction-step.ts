import sample from "lodash/sample";
import md5 from "md5";
import { Task } from "pg-compose";

import { CampaignContact } from "../../api/campaign-contact";
import { MessageInput } from "../../api/types";
import { User } from "../../api/user";
import { recordToCamelCase } from "../../lib/attributes";
import { applyScript } from "../../lib/scripts";
import { sendMessage } from "../api/lib/send-message";
import {
  CampaignContactRecord,
  InteractionStepRecord,
  UserRecord
} from "../api/types";
import { r } from "../models";
import { SendTimeMessagingError } from "../send-message-errors";

export interface RetryInteractionStepPayload {
  campaignContactId: number;
  unassignAfterSend?: boolean;
}

interface RetryInteractionStepRecord {
  campaign_contact: CampaignContactRecord;
  interaction_step: InteractionStepRecord;
  assignment_id: string;
  user: UserRecord;
}

export const retryInteractionStep: Task = async (
  payload: RetryInteractionStepPayload,
  helpers
) => {
  const { campaignContactId } = payload;

  const {
    rows: [record]
  } = await helpers.query<RetryInteractionStepRecord>(
    `
      select
        to_json(cc) as campaign_contact,
        to_json(istep) as interaction_step,
        a.id as assignment_id,
        to_json(u) as user
      from campaign_contact cc
      join interaction_step istep on istep.campaign_id = cc.campaign_id
      join assignment a on a.id = cc.assignment_id
      join public.user u on u.id = a.user_id
      where
        cc.id = $1
        and istep.parent_interaction_id is null
    `,
    [campaignContactId]
  );

  if (!record)
    throw new Error(
      `Campaign contact ${campaignContactId} incorrectly configured for retry-interaction-step`
    );

  const { campaign_contact, interaction_step, assignment_id, user } = record;

  const { rows: campaignVariables } = await helpers.query<
    CampaignVariableRecord
  >(
    "select * from campaign_variable where campaign_id = $1 and deleted_at is null",
    [campaign_contact.campaign_id]
  );

  const script = sample(interaction_step.script_options)!;
  const contact = recordToCamelCase<CampaignContact>(campaign_contact);
  const texter = recordToCamelCase<User>(user);
  const customFields = Object.keys(JSON.parse(contact.customFields));
  const campaignVariableIds = campaignVariables.map(({ id }) => id);

  const body = applyScript({
    script,
    contact,
    customFields,
    campaignVariables,
    texter
  });

  const message: MessageInput = {
    text: body,
    contactNumber: campaign_contact.cell,
    assignmentId: assignment_id,
    userId: `${user.id}`,
    versionHash: md5(script),
    campaignVariableIds
  };

  await r.knex.transaction(async (trx) => {
    try {
      await sendMessage(trx, user, `${campaignContactId}`, message);

      // if false or undefined, dont execute
      if (payload.unassignAfterSend === true) {
        await trx("campaign_contact")
          .update({ assignment_id: null })
          .where({ id: payload.campaignContactId });
      }
    } catch (err) {
      if (!(err instanceof SendTimeMessagingError)) throw err;
    }
  });
};
