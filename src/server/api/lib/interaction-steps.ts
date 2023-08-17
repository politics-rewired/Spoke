/* eslint-disable import/prefer-default-export */
import type { InteractionStepWithChildren } from "@spoke/spoke-codegen";
import type { Knex } from "knex";

import { r } from "../../models";
import type { CampaignRecord } from "../types";

const mapTokensToTriggers = (tokens: string[], stepId: number) => {
  return tokens.map((token: string) => {
    return {
      interaction_step_id: stepId,
      token
    };
  });
};

const removeMatchingTokens = (tokens1: string[], tokens2: string[]) => {
  return tokens1.filter((token: string) => !tokens2.includes(token));
};

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

  const tokens = rootInteractionStep.autoReplyTokens as string[];

  if (rootInteractionStep.id.indexOf("new") !== -1) {
    // Insert new interaction steps
    const [{ id: newId }] = await knexTrx("interaction_step")
      .insert({
        ...payload,
        parent_interaction_id: rootInteractionStep.parentInteractionId || null,
        campaign_id: campaignId,
        is_deleted: false
      })
      .returning("id");

    // Update the mapping of temporary IDs
    temporaryIdMap[rootInteractionStep.id] = newId;

    rootStepId = newId;

    if (tokens?.length) {
      const triggers = mapTokensToTriggers(tokens, newId);
      await knexTrx("auto_reply_trigger").insert(triggers);
    }
  } else {
    // Update the interaction step record
    await knexTrx("interaction_step")
      .where({ id: rootInteractionStep.id })
      .update(payload)
      .returning("id");

    const existingTokens = await r
      .reader("auto_reply_trigger")
      .where({ interaction_step_id: rootInteractionStep.id })
      .pluck("token");

    if (tokens && existingTokens) {
      const tokensToInsert = removeMatchingTokens(tokens, existingTokens);
      const triggersToInsert = mapTokensToTriggers(
        tokensToInsert,
        parseInt(rootInteractionStep.id, 10)
      );

      if (triggersToInsert.length)
        await knexTrx("auto_reply_trigger").insert(triggersToInsert);

      const tokensToDelete = removeMatchingTokens(existingTokens, tokens);

      await knexTrx("auto_reply_trigger")
        .where({ interaction_step_id: rootInteractionStep.id })
        .whereIn("token", tokensToDelete)
        .delete();
    }
  }

  // Persist child interaction steps
  const childSteps = rootInteractionStep.interactionSteps;
  if (childSteps) {
    const childStepsWithChildren = childSteps as InteractionStepWithChildren[];

    const childStepIds = await Promise.all(
      childStepsWithChildren.map((childStep) =>
        persistInteractionStepNode(
          campaignId,
          childStep,
          knexTrx,
          temporaryIdMap
        )
      )
    ).then((childResults) =>
      childResults.reduce((acc, childIds) => acc.concat(childIds), [])
    );

    return childStepIds.concat([rootStepId]);
  }
  return [rootStepId];
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

  const delQuery = knexTrx.raw(
    `
      with steps_to_delete as (
        select id,
          (exists(select 1 from question_response where interaction_step_id = ins.id) 
            or exists(select 1 from all_external_sync_question_response_configuration 
              where interaction_step_id = ins.id)
          ) for_update
        from interaction_step ins
        where campaign_id = ?
        and id <> all (?)
      ),

      delete_steps as (
        delete from interaction_step ins
        using steps_to_delete del
        where ins.id = del.id and not for_update
        returning *
      ),

      update_steps as (
        update interaction_step ins
        set is_deleted = true
        from steps_to_delete del
        where ins.id = del.id and for_update
        returning *
      ),

      delete_triggers as (
        delete from auto_reply_trigger
        using steps_to_delete del
        where interaction_step_id = del.id
        returning *
      )

      select count(*) from delete_steps 
      union select count(*) from update_steps
      union select count(*) from delete_triggers
    `,
    [campaignId, stepIds]
  );
  await delQuery;
};
