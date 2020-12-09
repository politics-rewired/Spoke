import { Organization } from "./organization";
import { User } from "./user";

export interface AssignmentRequest {
  id: string;
  amount: number;
  organization: Organization;
  createdAt: string;
  updatedAt: string;
  user: User;
  status: string;
}

export const schema = `
  type AssignmentRequest {
    id: ID!
    amount: Int!
    organization: Organization!
    createdAt: Date!
    updatedAt: Date!
    user: User!
    status: String!
  }
`;
