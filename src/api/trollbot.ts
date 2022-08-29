import type { CampaignContact } from "./campaign-contact";
import type { User } from "./user";

export enum TrollTriggerMode {
  Simple = "SIMPLE",
  English = "ENGLISH",
  Spanish = "SPANISH"
}

export interface TrollTrigger {
  id: string;
  token: string;
  mode: TrollTriggerMode;
  compiledTsQuery: string;
  organizationId: string;
}

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
