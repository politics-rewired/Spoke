export interface ExternalList {
  systemId: string;
  externalId: string;
  name: string;
  description: string;
  listCount: number;
  doorCount: number;
  createdAt: string;
  updatedAt: string;
}

export const schema = `
  type ExternalList {
    systemId: String!
    externalId: String!
    name: String!
    description: String!
    listCount: Int!
    doorCount: Int!
    createdAt: Date!
    updatedAt: Date!
  }

  type ExternalListEdge {
    cursor: Cursor!
    node: ExternalList!
  }

  type ExternalListPage {
    edges: [ExternalListEdge!]!
    pageInfo: RelayPageInfo!
  }
`;
