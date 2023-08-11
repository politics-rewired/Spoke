export const schema = `
  type InteractionStep {
    id: ID!
    question: Question
    questionText: String
    scriptOptions: [String]!
    answerOption: String
    parentInteractionId: String
    autoReplyTokens: [String]
    isDeleted: Boolean
    answerActions: String
    questionResponse(campaignContactId: String): QuestionResponse
    createdAt: Date!
  }

  input InteractionStepInput {
    id: String
    questionText: String
    scriptOptions: [String]!
    answerOption: String
    answerActions: String
    autoReplyTokens: [String]
    parentInteractionId: String
    isDeleted: Boolean
    createdAt: Date
    interactionSteps: [InteractionStepInput]
  }
`;
export default schema;
