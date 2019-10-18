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
        .table("question_response")
        .getAll(answer.parent_interaction_step, {
          index: "interaction_step_id"
        })
        .filter({
          value: answer.value
        })
        .eqJoin("campaign_contact_id", r.table("campaign_contact"))("right"),
    responderCount: async answer =>
      r
        .table("question_response")
        .getAll(answer.parent_interaction_step, {
          index: "interaction_step_id"
        })
        .filter({
          value: answer.value
        })
        .count(),
    question: async answer => answer.parent_interaction_step
  }
};
