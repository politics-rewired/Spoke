import type { Campaign } from "./campaign";
import type { Tag } from "./tag";
import type { TextRequestType } from "./types";
import type { User } from "./user";

export interface Team {
  id: string;
  title: string;
  description: string;
  textColor: string;
  backgroundColor: string;
  author: User;
  isAssignmentEnabled: boolean;
  assignmentPriority: number | null;
  assignmentType: TextRequestType;
  maxRequestCount: number;
  createdAt: string;

  users: User[];
  campaigns: Campaign[];
  escalationTags: Tag[];
}

export interface TeamInput {
  id: string | null;
  title: string | null;
  description: string | null;
  textColor: string | null;
  backgroundColor: string | null;
  isAssignmentEnabled: boolean | null;
  assignmentPriority: number | null;
  assignmentType: TextRequestType;
  maxRequestCount: number | null;
  escalationTagIds: string[] | null;
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
    assignmentPriority: Int
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
    escalationTagIds: [String!]
  }
`;
