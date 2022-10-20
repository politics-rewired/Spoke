export const schema = `
  type TrollAlarm {
    id: ID!
    messageId: ID!
    messageText: String!
    token: String!
    dismissed: Boolean!
    user: User!
    contact: CampaignContact!
  }

  type TrollAlarmPage {
    totalCount: Int!
    alarms: [TrollAlarm!]!
  }

  enum TrollTriggerMode {
    SIMPLE
    ENGLISH
    SPANISH
  }

  input TrollTriggerInput {
    token: String!
    mode: TrollTriggerMode!
  }

  type TrollTrigger {
    id: ID!
    token: String!
    mode: TrollTriggerMode!
    compiledTsQuery: String!
    organizationId: String!
  }

  type TrollAlarmCount {
    totalCount: Int!
  }
`;

export default schema;
