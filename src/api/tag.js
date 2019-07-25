export const schema = `
  type Tag {
    id: ID
    title: String
    description: String
    author: User
    isAssignable: Boolean
    isSystem: Boolean
    createdAt: Date

    contacts(campaignId: String): [CampaignContact]
  }

  input TagInput {
    id: ID
    title: String!
    description: String!
    isAssignable: Boolean!
  }
`;
