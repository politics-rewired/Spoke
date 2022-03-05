import type { Question } from "./question";

export interface QuestionResponse {
  id: string;
  value: string;
  question: Question;
}

export const schema = `
  type QuestionResponse {
    id: String
    value: String
    question: Question
  }
`;
