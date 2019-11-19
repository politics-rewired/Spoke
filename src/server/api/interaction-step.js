import { mapFieldsToModel } from "./lib/utils";
import { InteractionStep, r } from "../models";

export const resolvers = {
  InteractionStep: {
    ...mapFieldsToModel(
      [
        "id",
        "answerOption",
        "answerActions",
        "parentInteractionId",
        "isDeleted"
      ],
      InteractionStep
    ),
    scriptOptions: async interactionStep => {
      const { script, script_options } = interactionStep;
      return script_options || [script];
    },
    questionText: async interactionStep => {
      return interactionStep.question;
    },
    question: async interactionStep => interactionStep,
    questionResponse: async (interactionStep, { campaignContactId }) =>
      r
        .reader("question_response")
        .where({
          campaign_contact_id: campaignContactId,
          interaction_step_id: interactionStep.id
        })
        .first()
  }
};
