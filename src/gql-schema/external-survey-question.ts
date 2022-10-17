export const schema = `
  type ExternalSurveyQuestion {
    id: String!
    systemId: String!
    externalId: String!
    type: String!
    cycle: Int!
    name: String!
    mediumName: String!
    shortName: String!
    scriptQuestion: String!
    status: ExternalDataCollectionStatus!
    createdAt: Date!
    updatedAt: Date!
    responseOptions(after: Cursor, first: Int): ExternalSurveyQuestionResponseOptionPage!
  }

  type ExternalSurveyQuestionEdge {
    cursor: Cursor!
    node: ExternalSurveyQuestion!
  }

  type ExternalSurveyQuestionPage {
    edges: [ExternalSurveyQuestionEdge!]!
    pageInfo: RelayPageInfo!
  }
`;
export default schema;
