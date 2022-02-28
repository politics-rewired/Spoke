import type { CampaignContact } from "./campaign-contact";
import type { InteractionStep } from "./interaction-step";

export interface AnswerOption {
  interactionStepId: string;
  value: string;
  action: string;
  nextInteractionStep: InteractionStep;
  responders: CampaignContact[];
  responderCount: number;
  question: Question;
}

export interface Question {
  text: string;
  answerOptions: AnswerOption[];
  interactionStep: InteractionStep;
}

export const schema = `
  type Question {
    text: String
    answerOptions: [AnswerOption]
    interactionStep: InteractionStep
  }

  type AnswerOption {
    interactionStepId: Int
    value: String
    action: String
    nextInteractionStep: InteractionStep
    responders: [CampaignContact]
    responderCount: Int
    question: Question
  }
`;
