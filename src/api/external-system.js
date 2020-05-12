export const schema = `
  input ExternalSystemInput {
    name: String!
    type: String!
    apiKey: String!
  }

  type ExternalSystem {
    name: String!
    type: String!
    apiKey: String!
    organizationId: Int!
  }
`;
