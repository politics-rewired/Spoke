import { r } from "../models";
import { memoizer, cacheOpts } from "../memoredis";

export const resolvers = {
  Question: {
    text: async interactionStep => interactionStep.question,
    answerOptions: async interactionStep => {
      const getAnswerOptions = memoizer.memoize(
        async ({ interactionStepId }) => {
          const answerOptions = await r
            .reader("interaction_step")
            .select("*")
            .where({
              campaign_id: interactionStep.campaign_id,
              parent_interaction_id: interactionStepId,
              is_deleted: false
            })
            .orderBy("answer_option");

          return answerOptions.map(answerOption => ({
            value: answerOption.answer_option,
            action: answerOption.answer_actions,
            interaction_step_id: answerOption.id,
            parent_interaction_step: answerOption.parent_interaction_id,
            campaign_id: answerOption.campaign_id
          }));
        },
        cacheOpts.InteractionStepChildren
      );

      return await getAnswerOptions({ interactionStepId: interactionStep.id });
    },
    interactionStep: async interactionStep => interactionStep
  },
  AnswerOption: {
    value: answer => answer.value,
    interactionStepId: answer => answer.interaction_step_id,
    nextInteractionStep: async answer => {
      const getInteractionStep = memoizer.memoize(
        async ({ interactionStepId }) => {
          return await r
            .reader("interaction_step")
            .first("*")
            .where({ id: interactionStepId, campaign_id: answer.campaign_id });
        },
        cacheOpts.InteractionStepSingleton
      );

      return await getInteractionStep({
        interactionStepId: answer.interaction_step_id
      });
    },
    responders: async answer =>
      r
        .reader("question_response")
        .join("campaign_contact", function() {
          this.on(
            "campaign_contact.id",
            "=",
            "question_response.campaign_contact_id"
          ).andOn(
            "campaign_contact.campaign_id",
            "=",
            "question_response.campaign_id"
          );
        })
        .where({
          interaction_step_id: answer.parent_interaction_step,
          value: answer.value
        }),
    responderCount: async answer =>
      r.parseCount(
        r
          .reader("question_response")
          .join("campaign_contact", function() {
            this.on(
              "campaign_contact.id",
              "=",
              "question_response.campaign_contact_id"
            ).andOn(
              "campaign_contact.campaign_id",
              "=",
              "question_response.campaign_id"
            );
          })
          .where({
            interaction_step_id: answer.parent_interaction_step,
            value: answer.value
          })
          .count()
      ),
    question: async answer => answer.parent_interaction_step
  }
};
