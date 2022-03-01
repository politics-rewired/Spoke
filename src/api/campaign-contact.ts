import type { Campaign } from "./campaign";
import type { InteractionStep } from "./interaction-step";
import type { Message } from "./message";
import type { OptOut } from "./opt-out";
import type { AnswerOption } from "./question";

export interface Location {
  city: string;
  state: string;
}

export interface ContactsFilter {
  messageStatus: string;
  isOptedOut: boolean;
  validTimezone: boolean;
  includePastDue: boolean;
}

export interface CampaignContact {
  id: string;
  firstName: string;
  lastName: string;
  cell: string;
  zip: string;
  external_id: string;
  customFields: any;
  messages: Message[];
  timezone: string;
  location: Location | null;
  optOut: OptOut;
  campaign: Campaign;
  questionResponseValues: AnswerOption[];
  questionResponses: AnswerOption[];
  interactionSteps: InteractionStep[];
  messageStatus: string;
  assignmentId: string;
  updatedAt: Date;
}

export interface CampaignContactInput {
  firstName: string;
  lastName: string;
  cell: string;
  zip: string | null;
  external_id: string | null;
  customFields: string | null;
}

export const schema = `
  input ContactsFilter {
    messageStatus: String
    isOptedOut: Boolean
    validTimezone: Boolean
    includePastDue: Boolean
  }

  type Location {
    city: String
    state: String
  }

  input ContactNameFilter {
    firstName: String
    lastName: String
    cellNumber: String
  }

  type CampaignContact {
    id: ID
    firstName: String
    lastName: String
    cell: Phone
    zip: String
    external_id: String
    customFields: JSON
    messages: [Message]
    timezone: String
    location: Location
    optOut: OptOut
    campaign: Campaign
    questionResponseValues: [AnswerOption]
    questionResponses: [AnswerOption]
    interactionSteps: [InteractionStep]
    messageStatus: String
    assignmentId: String
    updatedAt: Date

    contactTags: [Tag]
  }

  input CampaignContactInput {
    firstName: String!
    lastName: String!
    cell: String!
    zip: String
    external_id: String
    customFields: String
  }
`;
