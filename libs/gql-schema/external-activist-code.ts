export const schema = `
  type ExternalActivistCode {
    id: String!
    systemId: String!
    externalId: String!
    type: String!
    name: String!
    mediumName: String!
    shortName: String!
    description: String
    scriptQuestion: String
    status: ExternalDataCollectionStatus!
    createdAt: Date!
    updatedAt: Date!
  }

  type ExternalActivistCodeEdge {
    cursor: Cursor!
    node: ExternalActivistCode!
  }

  type ExternalActivistCodePage {
    edges: [ExternalActivistCodeEdge!]!
    pageInfo: RelayPageInfo!
  }
`;
export default schema;
