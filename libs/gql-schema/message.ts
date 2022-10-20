export const schema = `
  type Message {
    id: ID
    text: String
    userNumber: String
    contactNumber: String
    createdAt: Date
    isFromContact: Boolean
    assignment: Assignment
    campaignId: String
    userId: ID
    sendStatus: String
    errorCodes: [String!]
  }
`;
export default schema;
