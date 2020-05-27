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
  lists: ExternalList[];
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
    lists: [ExternalList]!
  }
`;
