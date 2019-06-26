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
        .table("question_response")
        .getAll(campaignContactId, { index: "campaign_contact_id" })
        .filter({
          interaction_step_id: interactionStep.id
        })
        .limit(1)(0)
        .default(null)
  }
};
