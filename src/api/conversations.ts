import type { Campaign } from "./campaign";
import type { CampaignContact } from "./campaign-contact";
import type { User } from "./user";

export interface Conversation {
  texter: User;
  contact: CampaignContact;
  campaign: Campaign;
}

export const schema = `
  input ConversationFilter {
    assignmentsFilter: AssignmentsFilter
    campaignsFilter: CampaignsFilter
    contactsFilter: ContactsFilter
  }

  type Conversation {
    texter: User!
    contact: CampaignContact!
    campaign: Campaign!
  }
  
  type PaginatedConversations {
    conversations: [Conversation]!
    pageInfo: PageInfo
  }
`;
