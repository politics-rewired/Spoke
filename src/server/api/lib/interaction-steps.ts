/* eslint-disable import/prefer-default-export */
import Knex from "knex";

import { InteractionStepWithChildren } from "../../../api/interaction-step";
import { cacheOpts, memoizer } from "../../memoredis";
import { r } from "../../models";
import { CampaignRecord } from "../types";

export const persistInteractionStepTree = async (
  campaignId: number,
  rootInteractionStep: InteractionStepWithChildren,
  origCampaignRecord: Pick<CampaignRecord, "is_started">,
  knexTrx?: Knex,
  temporaryIdMap: Record<string, string> = {}
) => {
  // Perform updates in a transaction if one is not present
  if (!knexTrx) {
    return r.knex.transaction(async (trx) => {
      await persistInteractionStepTree(
        campaignId,
        rootInteractionStep,
        origCampaignRecord,
        trx,
        temporaryIdMap
      );
    });
  }

  // Update the parent interaction step ID if this step has a reference to a temporary ID
  // and the parent has since been inserted
  const { parentInteractionId } = rootInteractionStep;
  if (parentInteractionId && temporaryIdMap[parentInteractionId]) {
    rootInteractionStep.parentInteractionId =
      temporaryIdMap[parentInteractionId];
  }

  if (rootInteractionStep.id.indexOf("new") !== -1) {
    // Insert new interaction steps
    const [newId] = await knexTrx("interaction_step")
      .insert({
        parent_interaction_id: rootInteractionStep.parentInteractionId || null,
        question: rootInteractionStep.questionText,
        script_options: rootInteractionStep.scriptOptions,
        answer_option: rootInteractionStep.answerOption,
        answer_actions: rootInteractionStep.answerActions,
        campaign_id: campaignId,
        is_deleted: false
      })
      .returning("id");

    if (rootInteractionStep.parentInteractionId) {
      memoizer.invalidate(cacheOpts.InteractionStepChildren.key, {
        interactionStepId: rootInteractionStep.parentInteractionId
      });
    }

    // Update the mapping of temporary IDs
    temporaryIdMap[rootInteractionStep.id] = newId;
  } else if (!origCampaignRecord.is_started && rootInteractionStep.isDeleted) {
    // Hard delete interaction steps if the campaign hasn't started
    await knexTrx("interaction_step")
      .where({ id: rootInteractionStep.id })
      .delete();
  } else {
    // Update the interaction step record
    await knexTrx("interaction_step")
      .where({ id: rootInteractionStep.id })
      .update({
        question: rootInteractionStep.questionText,
        script_options: rootInteractionStep.scriptOptions,
        answer_option: rootInteractionStep.answerOption,
        answer_actions: rootInteractionStep.answerActions,
        is_deleted: rootInteractionStep.isDeleted
      });

    memoizer.invalidate(cacheOpts.InteractionStepSingleton.key, {
      interactionStepId: rootInteractionStep.id
    });
  }

  // Persist child interaction steps
  await Promise.all(
    rootInteractionStep.interactionSteps.map(async (childStep) => {
      await persistInteractionStepTree(
        campaignId,
        childStep,
        origCampaignRecord,
        knexTrx,
        temporaryIdMap
      );
    })
  );
};
