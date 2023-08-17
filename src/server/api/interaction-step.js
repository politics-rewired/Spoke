import { r } from "../models";
import { sqlResolvers } from "./lib/utils";

export const resolvers = {
  InteractionStep: {
    ...sqlResolvers([
      "id",
      "answerOption",
      "answerActions",
      "parentInteractionId",
      "isDeleted",
      "createdAt"
    ]),
    scriptOptions: async (interactionStep) => {
      const { script, script_options } = interactionStep;
      return script_options || [script];
    },
    questionText: async (interactionStep) => {
      return interactionStep.question;
    },
    question: async (interactionStep) => interactionStep,
    questionResponse: async (interactionStep, { campaignContactId }) =>
      r
        .reader("question_response")
        .where({
          campaign_contact_id: campaignContactId,
          interaction_step_id: interactionStep.id
        })
        .first()
        .then((qr) => qr || null),
    autoReplyTokens: async (interactionStep) =>
      r
        .reader("auto_reply_trigger")
        .where({
          interaction_step_id: interactionStep.id
        })
        .pluck("token")
  }
};

export default resolvers;
