import isNil from "lodash/isNil";

import { ActionType } from "../api/types";
import { r } from "../models";

export const queueExternalSyncForAction = async (
  actionType: ActionType,
  actionId: number
) => {
  let campaign;

  switch (actionType) {
    case ActionType.QuestionReponse:
      campaign = await r
        .knex("campaign")
        .join("interaction_step", "interaction_step.campaign_id", "campaign.id")
        .join(
          "all_question_response",
          "all_question_response.interaction_step_id",
          "interaction_step.id"
        )
        .where({ "all_question_response.id": actionId })
        .first();
      break;
    case ActionType.OptOut:
      campaign = await r
        .knex("campaign")
        .join("assignment", "assignment.campaign_id", "campaign.id")
        .join("opt_out", "opt_out.assignment_id", "assignment.id")
        .where({ "opt_out.id": actionId })
        .first();
      break;
    default:
      campaign = null;
  }

  if (isNil(campaign?.external_system_id)) return;

  const payload = {
    actionType,
    actionId,
    campaignContactId: campaign.campaign_contact_id
  };

  await r.knex.raw(
    `
  SELECT graphile_worker.add_job('queue-action-external-sync', ?)
  `,
    [payload]
  );
};

export const refreshExternalSystem = (systemId: string) =>
  Promise.all([
    r.knex.raw("select * from public.queue_refresh_saved_lists(?)", [systemId]),
    r.knex.raw("select * from public.queue_refresh_van_survey_questions(?)", [
      systemId
    ]),
    r.knex.raw("select * from public.queue_refresh_van_activist_codes(?)", [
      systemId
    ]),
    r.knex.raw("select * from public.queue_refresh_van_result_codes(?)", [
      systemId
    ])
  ]);
