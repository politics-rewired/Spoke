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
export default schema;
