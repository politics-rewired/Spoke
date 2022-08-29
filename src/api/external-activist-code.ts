import type { ExternalDataCollectionStatus } from "./types";

export interface ExternalActivistCode {
  id: string;
  systemId: string;
  externalId: string;
  type: string;
  name: string;
  mediumName: string;
  shortName: string;
  description: string | null;
  scriptQuestion: string | null;
  status: ExternalDataCollectionStatus;
  createdAt: string;
  updatedAt: string;
}

export const schema = `
  type ExternalActivistCode {
    id: String!
    systemId: String!
    externalId: String!
    type: String!
    name: String!
    mediumName: String!
    shortName: String!
    description: String
    scriptQuestion: String
    status: ExternalDataCollectionStatus!
    createdAt: Date!
    updatedAt: Date!
  }

  type ExternalActivistCodeEdge {
    cursor: Cursor!
    node: ExternalActivistCode!
  }

  type ExternalActivistCodePage {
    edges: [ExternalActivistCodeEdge!]!
    pageInfo: RelayPageInfo!
  }
`;
