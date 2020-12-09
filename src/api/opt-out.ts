import { Assignment } from "./assignment";

export interface OptOut {
  id: string;
  cell: string;
  assignment: Assignment;
  createdAt: string;
}

export const schema = `
  type OptOut {
    id: ID
    cell: String
    assignment: Assignment
    createdAt: Date
  }
`;

export default schema;
