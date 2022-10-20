export const schema = `
  type ExternalResultCode {
    id: String!
    systemId: String!
    externalId: String!
    name: String!
    mediumName: String!
    shortName: String!
    createdAt: Date!
    updatedAt: Date!
  }

  type ExternalResultCodeEdge {
    cursor: Cursor!
    node: ExternalResultCode!
  }

  type ExternalResultCodePage {
    edges: [ExternalResultCodeEdge!]!
    pageInfo: RelayPageInfo!
  }
`;
export default schema;
