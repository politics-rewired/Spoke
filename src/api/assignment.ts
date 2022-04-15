import type { Campaign } from "./campaign";
import type { CampaignContact } from "./campaign-contact";
import type { CannedResponse } from "./canned-response";
import type { User } from "./user";

export interface TexterAssignmentInput {
  userId: string;
  contactsCount: number;
}

export interface Assignment {
  id: string;
  texter: User;
  campaign: Campaign;
  contacts: CampaignContact[];
  contactsCount: number;
  userCannedResponses: CannedResponse[];
  campaignCannedResponses: CannedResponse[];
  maxContacts?: number | null;
}

export const schema = `
  input AssignmentsFilter {
    texterId: Int
    includeEscalated: Boolean
  }

  type Assignment {
    id: ID!
    texter: User!
    campaign: Campaign!
    contacts(contactsFilter: ContactsFilter): [CampaignContact!]!
    contactsCount(contactsFilter: ContactsFilter): Int!
    userCannedResponses: [CannedResponse!]!
    campaignCannedResponses: [CannedResponse!]!
    maxContacts: Int
  }
`;
