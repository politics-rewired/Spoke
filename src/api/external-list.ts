export interface ExternalList {
  systemId: string;
  externalId: string;
  name: string;
  description: string;
  listCount: number;
  doorCount: number;
}

export const schema = `
  type ExternalList {
    systemId: String!
    externalId: String!
    name: String!
    description: String!
    listCount: Int!
    doorCount: Int!
  }
`;
