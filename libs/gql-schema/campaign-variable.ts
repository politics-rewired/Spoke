export const schema = `
  input CampaignVariableInput {
    displayOrder: Int!
    name: String!
    value: String
  }

  type CampaignVariable {
    id: ID!
    displayOrder: Int!
    name: String!
    value: String
    createdAt: String!
    updatedAt: String!
  }

  type CampaignVariableEdge {
    cursor: Cursor!
    node: CampaignVariable!
  }

  type CampaignVariablePage {
    edges: [CampaignVariableEdge!]!
    pageInfo: RelayPageInfo!
  }
`;

export default schema;
