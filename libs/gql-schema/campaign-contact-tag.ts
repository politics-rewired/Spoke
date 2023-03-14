export const schema = `
  type CampaignContactTag {
    id: String!
    tag: Tag!
    tagger: User!
    createdAt: String!
    updatedAt: String!
  }
`;

export default schema;
