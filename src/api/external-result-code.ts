export interface ExternalResultCode {
  id: string;
  systemId: string;
  externalId: string;
  name: string;
  mediumName: string;
  shortName: string;
  createdAt: string;
  updatedAt: string;
}

export const resultCodeWarning = (
  resultCode: ExternalResultCode
): string | undefined => {
  switch (resultCode.name) {
    case "Disconnected":
      return "VAN recommends using Deliverability Error instead!";
    default:
      return undefined;
  }
};

export const schema = `
  type ExternalResultCode {
    id: String!
    systemId: String!
    externalId: String!
    name: String!
    mediumName: String!
    shortName: String!
    createdAt: Date!
    updatedAt: Date!
  }

  type ExternalResultCodeEdge {
    cursor: Cursor!
    node: ExternalResultCode!
  }

  type ExternalResultCodePage {
    edges: [ExternalResultCodeEdge!]!
    pageInfo: RelayPageInfo!
  }
`;
