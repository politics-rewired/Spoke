import { Campaign } from "./campaign";
import { Tag } from "./tag";
import { TextRequestType } from "./types";
import { User } from "./user";

export interface Team {
  id: string;
  title: string;
  description: string;
  textColor: string;
  backgroundColor: string;
  author: User;
  isAssignmentEnabled: boolean;
  assignmentPriority: number;
  assignmentType: TextRequestType;
  maxRequestCount: number;
  createdAt: string;

  users: User[];
  campaigns: Campaign[];
  escalationTags: Tag[];
}

export const schema = `
  type Team {
    id: ID!
    title: String!
    description: String!
    textColor: String!
    backgroundColor: String!
    author: User
    isAssignmentEnabled: Boolean!
    assignmentPriority: Int!
    assignmentType: TextRequestType
    maxRequestCount: Int
    createdAt: Date!

    users: [User]!
    campaigns: [Campaign]!
    escalationTags: [Tag]
  }

  input TeamInput {
    id: ID
    title: String
    description: String
    textColor: String
    backgroundColor: String
    isAssignmentEnabled: Boolean
    assignmentPriority: Int
    assignmentType: TextRequestType
    maxRequestCount: Int
    escalationTagIds: [Int]
  }
`;
