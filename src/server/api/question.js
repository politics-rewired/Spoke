import { r } from "../models";

export const resolvers = {
  Question: {
    text: async interactionStep => interactionStep.question,
    answerOptions: async interactionStep =>
      r
        .reader("interaction_step")
        .select("*")
        .where({
          parent_interaction_id: interactionStep.id,
          is_deleted: false
        })
        .orderBy("answer_option")
        .then(answerOptions =>
          answerOptions.map(answerOption => ({
            value: answerOption.answer_option,
            action: answerOption.answer_actions,
            interaction_step_id: answerOption.id,
            parent_interaction_step: answerOption.parent_interaction_id
          }))
        ),
    interactionStep: async interactionStep => interactionStep
  },
  AnswerOption: {
    value: answer => answer.value,
    interactionStepId: answer => answer.interaction_step_id,
    nextInteractionStep: async answer =>
      r
        .reader("interaction_step")
        .first("*")
        .where({ id: answer.interaction_step_id }),
    responders: async answer =>
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
    responderCount: async answer =>
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
    question: async answer => answer.parent_interaction_step
  }
};
