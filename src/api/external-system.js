export const schema = `
  enum ExternalSystemType {
    VAN
  }
  
  input ExternalSystemInput {
    name: String!
    type: ExternalSystemType!
    apiKey: String!
  }

  type ExternalSystem {
    id: String!
    name: String!
    type: String!
    apiKey: String!
    organizationId: Int!
  }
`;
