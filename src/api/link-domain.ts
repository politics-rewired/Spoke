export interface LinkDomain {
  id: string;
  domain: string;
  maxUsageCount: number;
  currentUsageCount: number;
  isManuallyDisabled: boolean;
  isHealthy: boolean;
  cycledOutAt: string;
  createdAt: string;
}

export interface UnhealthyLinkDomain {
  id: string;
  domain: string;
  createdAt: string;
  healthyAgainAt: string;
}

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
