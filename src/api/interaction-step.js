export const schema = `
  type InteractionStep {
    id: ID!
    question: Question
    questionText: String
    scriptOptions: [String]!
    answerOption: String
    parentInteractionId: String
    isDeleted: Boolean
    answerActions: String
    questionResponse(campaignContactId: String): QuestionResponse
  }
`;

export default schema;
