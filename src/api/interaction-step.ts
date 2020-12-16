import { Question } from "./question";
import { QuestionResponse } from "./question-response";

export interface InteractionStep {
  id: string;
  question: Question;
  questionText: string;
  scriptOptions: string[];
  answerOption: string;
  parentInteractionId: string;
  isDeleted: boolean;
  answerActions: string;
  questionResponse: QuestionResponse;
  createdAt: Date;
}

export const schema = `
  type InteractionStep {
    id: ID!
    question: Question
    questionText: String
    scriptOptions: [String]!
    answerOption: String
    parentInteractionId: String
    isDeleted: Boolean
    answerActions: String
    questionResponse(campaignContactId: String): QuestionResponse
    createdAt: Date!
  }
`;
