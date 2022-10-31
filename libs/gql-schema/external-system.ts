export const schema = `
  enum ExternalSystemType {
    VAN
  }

  enum VanOperationMode {
    VOTERFILE
    MYCAMPAIGN
  }

  enum ExternalDataCollectionStatus {
    ACTIVE
    ARCHIVED
    INACTIVE
  }
  
  input ExternalSystemInput {
    name: String!
    type: ExternalSystemType!
    username: String!
    apiKey: String!
    operationMode: VanOperationMode!
  }

  input ExternalSurveyQuestionFilter {
    status: ExternalDataCollectionStatus
  }

  input ExternalActivistCodeFilter {
    status: ExternalDataCollectionStatus
  }

  type ExternalSystem {
    id: String!
    name: String!
    type: ExternalSystemType!
    username: String!
    apiKey: String!
    organizationId: String!
    createdAt: Date!
    updatedAt: Date!
    syncedAt: Date
    operationMode: VanOperationMode!
    lists(after: Cursor, first: Int): ExternalListPage!
    surveyQuestions(filter: ExternalSurveyQuestionFilter, after: Cursor, first: Int): ExternalSurveyQuestionPage!
    activistCodes(filter: ExternalActivistCodeFilter, after: Cursor, first: Int): ExternalActivistCodePage!
    resultCodes(after: Cursor, first: Int): ExternalResultCodePage!
    optOutSyncConfig: ExternalResultCodeTarget
  }

  type ExternalSystemEdge {
    cursor: Cursor!
    node: ExternalSystem!
  }

  type ExternalSystemPage {
    edges: [ExternalSystemEdge!]!
    pageInfo: RelayPageInfo!
  }
`;
export default schema;
