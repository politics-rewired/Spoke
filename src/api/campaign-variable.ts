import type { RelayEdge, RelayPaginatedResponse } from "./pagination";

export interface CampaignVariableInput {
  order: number;
  name: string;
  value?: string | null;
}

export interface CampaignVariable {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export type CampaignVariableEdge = RelayEdge<CampaignVariable>;

export type CampaignVariablePage = RelayPaginatedResponse<CampaignVariable>;

export const schema = `
  input CampaignVariableInput {
    order: Int!
    name: String!
    value: String
  }

  type CampaignVariable {
    id: ID!
    order: Int!
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