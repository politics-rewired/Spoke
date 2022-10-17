export const schema = `
  type ExternalResultCodeTarget {
    id: String!
    resultCode: ExternalResultCode!
  }

  type ExternalActivistCodeTarget {
    id: String!
    activistCode: ExternalActivistCode!
  }

  type ExternalSurveyQuestionResponseOptionTarget {
    id: String!
    responseOption: ExternalSurveyQuestionResponseOption!
  }

  union ExternalSyncConfigTarget = ExternalResultCodeTarget | ExternalActivistCodeTarget | ExternalSurveyQuestionResponseOptionTarget

  type ExternalSyncConfigTargetEdge {
    cursor: Cursor!
    node: ExternalSyncConfigTarget!
  }

  type ExternalSyncConfigTargetPage {
    edges: [ExternalSyncConfigTargetEdge!]!
    pageInfo: RelayPageInfo!
  }

  type ExternalSyncQuestionResponseConfig {
    id: String!
    campaignId: String!
    interactionStepId: String!
    questionResponseValue: String!
    includesNotActive: Boolean!
    isMissing: Boolean!
    isRequired: Boolean!
    createdAt: Date
    updatedAt: Date
    interactionStep: InteractionStep!
    targets(after: Cursor, first: Int): [ExternalSyncConfigTarget]
  }

  type ExternalSyncQuestionResponseConfigEdge {
    cursor: Cursor!
    node: ExternalSyncQuestionResponseConfig!
  }

  type ExternalSyncQuestionResponseConfigPage {
    edges: [ExternalSyncQuestionResponseConfigEdge!]!
    pageInfo: RelayPageInfo!
  }

  type ExternalSyncTagConfig {
    id: String!
    systemId: String!
    tagId: String!
    includesNotActive: Boolean!
    isMissing: Boolean!
    isRequired: Boolean!
    createdAt: Date
    updatedAt: Date
    tag: Tag!
    targets(after: Cursor, first: Int): ExternalSyncConfigTargetPage
  }

  type ExternalSyncTagConfigEdge {
    cursor: Cursor!
    node: ExternalSyncTagConfig!
  }

  type ExternalSyncTagConfigPage {
    edges: [ExternalSyncTagConfigEdge!]!
    pageInfo: RelayPageInfo!
  }
`;
export default schema;
