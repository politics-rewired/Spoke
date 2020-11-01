import { cacheOpts, memoizer } from "../memoredis";
import { r } from "../models";

export const resolvers = {
  Question: {
    text: async (interactionStep) => interactionStep.question,
    answerOptions: async (interactionStep) => {
      const getAnswerOptions = memoizer.memoize(
        async ({ interactionStepId }) => {
          const answerOptions = await r
            .reader("interaction_step")
            .select("*")
            .where({
              parent_interaction_id: interactionStepId,
              is_deleted: false
            })
            .orderBy("answer_option");

          return answerOptions.map((answerOption) => ({
            value: answerOption.answer_option,
            action: answerOption.answer_actions,
            interaction_step_id: answerOption.id,
            parent_interaction_step: answerOption.parent_interaction_id
          }));
        },
        cacheOpts.InteractionStepChildren
      );

      return getAnswerOptions({ interactionStepId: interactionStep.id });
    },
    interactionStep: async (interactionStep) => interactionStep
  },
  AnswerOption: {
    value: (answer) => answer.value,
    interactionStepId: (answer) => answer.interaction_step_id,
    nextInteractionStep: async (answer) => {
      const getInteractionStep = memoizer.memoize(
        async ({ interactionStepId }) => {
          return r
            .reader("interaction_step")
            .first("*")
            .where({ id: interactionStepId });
        },
        cacheOpts.InteractionStepSingleton
      );

      return getInteractionStep({
        interactionStepId: answer.interaction_step_id
      });
    },
    responders: async (answer) =>
      r
        .reader("question_response")
        .join(
          "campaign_contact",
          "campaign_contact.id",
          "question_response.campaign_contact_id"
        )
        .where({
          interaction_step_id: answer.parent_interaction_step,
          value: answer.value
        }),
    responderCount: async (answer) =>
      r.parseCount(
        r
          .reader("question_response")
          .join(
            "campaign_contact",
            "campaign_contact.id",
            "question_response.campaign_contact_id"
          )
          .where({
            interaction_step_id: answer.parent_interaction_step,
            value: answer.value
          })
          .count()
      ),
    question: async (answer) => answer.parent_interaction_step
  }
};

export default resolvers;
