/* eslint-disable import/prefer-default-export */
import type { Knex } from "knex";

import type { InteractionStepWithChildren } from "../../../api/interaction-step";
import { cacheOpts, memoizer } from "../../memoredis";
import { r } from "../../models";
import type { CampaignRecord } from "../types";

export const persistInteractionStepNode = async (
  campaignId: number,
  rootInteractionStep: InteractionStepWithChildren,
  knexTrx: Knex,
  temporaryIdMap: Record<string, string> = {}
): Promise<number[]> => {
  let rootStepId = parseInt(rootInteractionStep.id, 10);

  // Bail on deleted steps -- they will be dealt with by persistInteractionStepTree
  if (rootInteractionStep.isDeleted) return [];

  // Update the parent interaction step ID if this step has a reference to a temporary ID
  // and the parent has since been inserted
  const { parentInteractionId } = rootInteractionStep;
  if (parentInteractionId && temporaryIdMap[parentInteractionId]) {
    rootInteractionStep.parentInteractionId =
      temporaryIdMap[parentInteractionId];
  }

  const payload = {
    question: rootInteractionStep.questionText,
    script_options: rootInteractionStep.scriptOptions,
    answer_option: rootInteractionStep.answerOption,
    answer_actions: rootInteractionStep.answerActions
  };

  if (rootInteractionStep.id.indexOf("new") !== -1) {
    // Insert new interaction steps
    const [newId] = await knexTrx("interaction_step")
      .insert({
        ...payload,
        parent_interaction_id: rootInteractionStep.parentInteractionId || null,
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

    rootStepId = newId;
  } else {
    // Update the interaction step record
    await knexTrx("interaction_step")
      .where({ id: rootInteractionStep.id })
      .update(payload)
      .returning("id");

    memoizer.invalidate(cacheOpts.InteractionStepSingleton.key, {
      interactionStepId: rootInteractionStep.id
    });
  }

  // Persist child interaction steps
  const childStepIds = await Promise.all(
    rootInteractionStep.interactionSteps.map((childStep) =>
      persistInteractionStepNode(campaignId, childStep, knexTrx, temporaryIdMap)
    )
  ).then((childResults) =>
    childResults.reduce((acc, childIds) => acc.concat(childIds), [])
  );

  return childStepIds.concat([rootStepId]);
};

export const persistInteractionStepTree = async (
  campaignId: number,
  rootInteractionStep: InteractionStepWithChildren,
  origCampaignRecord: Pick<CampaignRecord, "is_started">,
  knexTrx?: Knex,
  temporaryIdMap: Record<string, string> = {}
): Promise<void> => {
  if (!knexTrx) {
    return r.knex.transaction((trx) =>
      persistInteractionStepTree(
        campaignId,
        rootInteractionStep,
        origCampaignRecord,
        trx,
        temporaryIdMap
      )
    );
  }

  const stepIds: number[] = await persistInteractionStepNode(
    campaignId,
    rootInteractionStep,
    knexTrx,
    temporaryIdMap
  );

  const delQuery = knexTrx("interaction_step")
    .where({ campaign_id: campaignId })
    .whereNotIn("id", stepIds);

  if (origCampaignRecord.is_started) {
    await delQuery.update({ is_deleted: true });
  } else {
    await delQuery.del();
  }
};
