import { Campaign } from "./campaign";
import { RelayEdge, RelayPaginatedResponse } from "./pagination";

export interface CampaignGroupInput {
  id?: string | null;
  name: string;
  description: string;
}

export interface CampaignGroup {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  campaignGroups: RelayPaginatedResponse<Campaign>;
  created_at: string;
  updated_at: string;
}

export type CampaignGroupEdge = RelayEdge<CampaignGroup>;

export type CampaignGroupPage = RelayPaginatedResponse<CampaignGroup>;

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
