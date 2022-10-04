import isNil from "lodash/isNil";

import { config } from "../../config";
import { ActionType } from "../api/types";
import { r } from "../models";

interface CampaignData {
  external_system_id: string;
  campaign_contact_id: number;
}

export const queueExternalSyncForAction = async (
  actionType: ActionType,
  actionId: number
) => {
  let campaign: CampaignData | null;

  if (!config.EXPERIMENTAL_VAN_SYNC) return;

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
        .select(["external_system_id", "campaign_contact_id"])
        .first();
      break;
    case ActionType.OptOut:
      campaign = await r
        .knex("campaign")
        .join("assignment", "assignment.campaign_id", "campaign.id")
        .join("opt_out", "opt_out.assignment_id", "assignment.id")
        .join(
          "campaign_contact",
          "campaign_contact.assignment_id",
          "opt_out.assignment_id"
        )
        .where({ "opt_out.id": actionId })
        .select([
          "external_system_id",
          "campaign_contact.id as campaign_contact_id"
        ])
        .first();
      break;
    default:
      campaign = null;
  }

  if (isNil(campaign?.external_system_id)) return;

  const payload = {
    actionType,
    actionId,
    campaignContactId: campaign?.campaign_contact_id
  };

  await r.knex.raw(
    `
  select graphile_worker.add_job('queue-action-external-sync', ?)
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
