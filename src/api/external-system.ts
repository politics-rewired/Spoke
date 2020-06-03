import { ExternalList } from "./external-list";

export enum ExternalSystemType {
  VAN = "VAN"
}

export interface ExternalSystem {
  id: string;
  name: string;
  type: ExternalSystemType;
  apiKey: string;
  organizationId: number;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  lists: ExternalList[];
}

export interface ExternalSystemInput {
  name: string;
  type: ExternalSystemType;
  apiKey: string;
}

export const schema = `
  enum ExternalSystemType {
    VAN
  }
  
  input ExternalSystemInput {
    name: String!
    type: ExternalSystemType!
    apiKey: String!
  }

  type ExternalSystem {
    id: String!
    name: String!
    type: ExternalSystemType!
    apiKey: String!
    organizationId: Int!
    createdAt: String!
    updatedAt: String!
    syncedAt: String
    lists: [ExternalList]!
  }
`;
