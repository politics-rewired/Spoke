export const schema = `
  type LinkDomain {
    id: ID!
    domain: String!
    maxUsageCount: Int!
    currentUsageCount: Int!
    isManuallyDisabled: Boolean!
    isHealthy: Boolean!
    cycledOutAt: Date!
    createdAt: Date!
  }

  type UnhealthyLinkDomain {
    id: ID!
    domain: String!
    createdAt: Date!
    healthyAgainAt: Date
  }
`;

export default schema;
