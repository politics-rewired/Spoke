export const schema = `
  input CampaignGroupInput {
    id: String
    name: String!
    description: String!
  }

  type CampaignGroup {
    id: ID!
    organizationId: String!
    name: String!
    description: String!
    campaigns: CampaignPage!
    createdAt: String!
    updatedAt: String!
  }

  type CampaignGroupEdge {
    cursor: Cursor!
    node: CampaignGroup!
  }

  type CampaignGroupPage {
    edges: [CampaignGroupEdge!]!
    pageInfo: RelayPageInfo!
  }
`;

export default schema;
