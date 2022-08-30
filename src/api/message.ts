import type { Assignment } from "./assignment";

export interface Message {
  id: string;
  text: string;
  userNumber: string;
  contactNumber: string;
  createdAt: string;
  isFromContact: boolean;
  assignment: Assignment;
  campaignId: string;
  userId: string;
  sendStatus: string;
  errorCodes: string[];
}

export const schema = `
  type Message {
    id: ID
    text: String
    userNumber: String
    contactNumber: String
    createdAt: Date
    isFromContact: Boolean
    assignment: Assignment
    campaignId: String
    userId: ID
    sendStatus: String
    errorCodes: [String!]
  }
`;
