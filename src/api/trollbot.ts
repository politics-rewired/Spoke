import { CampaignContact } from "./campaign-contact";
import { User } from "./user";

export interface TrollAlarm {
  id: string;
  messageId: string;
  messageText: string;
  token: string;
  dismissed: boolean;
  user: User;
  contact: CampaignContact;
}

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

  type TrollTrigger {
    id: ID!
    token: String!
    organizationId: String!
  }

  type TrollAlarmCount {
    totalCount: Int!
  }
`;

export default schema;
