import { sqlResolvers } from "./lib/utils";
import { r } from "../models";
import { parseIdentifier } from "./lib/partition-id-helpers";

export const resolvers = {
  InteractionStep: {
    ...sqlResolvers([
      "id",
      "answerOption",
      "answerActions",
      "parentInteractionId",
      "isDeleted"
    ]),
    scriptOptions: async interactionStep => {
      const { script, script_options } = interactionStep;
      return script_options || [script];
    },
    questionText: async interactionStep => {
      return interactionStep.question;
    },
    question: async interactionStep => interactionStep,
    questionResponse: async (interactionStep, { campaignContactId }) => {
      const [campaignId, contactId] = parseIdentifier(campaignContactId);

      return await r
        .reader("question_response")
        .where({
          campaign_contact_id: contactId,
          campaign_id: campaignId,
          interaction_step_id: interactionStep.id
        })
        .first()
        .then(qr => qr || null);
    }
  }
};
