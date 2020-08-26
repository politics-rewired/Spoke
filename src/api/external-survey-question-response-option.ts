export interface ExternalSurveyQuestionResponseOption {
  id: string;
  systemId: string;
  externalSurveyQuestionId: string;
  externalId: string;
  name: string;
  mediumName: string;
  shortName: string;
  createdAt: string;
  updatedAt: string;
}

export const schema = `
  type ExternalSurveyQuestionResponseOption {
    id: String!
    systemId: String!
    externalSurveyQuestionId: String!
    externalId: String!
    name: String!
    mediumName: String!
    shortName: String!
    createdAt: String!
    updatedAt: String!
  }

  type ExternalSurveyQuestionResponseOptionEdge {
    cursor: Cursor!
    node: ExternalSurveyQuestionResponseOption!
  }

  type ExternalSurveyQuestionResponseOptionPage {
    edges: [ExternalSurveyQuestionResponseOptionEdge!]!
    pageInfo: RelayPageInfo!
  }
`;
