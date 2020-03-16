export const schema = `
  type TrollAlarm {
    messageId: ID!
    messageText: String!
    token: String!
    dismissed: Boolean!
  }

  type TrollTrigger {
    token: String!
    organizationId: String!
  }
`;
