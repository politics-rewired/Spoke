import type { Campaign, PaginatedCampaigns } from "./campaign";
import type { CampaignGroupPage } from "./campaign-group";
import type { ExternalSystem } from "./external-system";
import type { LinkDomain, UnhealthyLinkDomain } from "./link-domain";
import type { MessagingServicePage } from "./messaging-service";
import type { OptOut } from "./opt-out";
import type { OrganizationMembership } from "./organization-membership";
import type { OrganizationSettings } from "./organization-settings";
import type { RelayPaginatedResponse } from "./pagination";
import type { Tag } from "./tag";
import type { Team } from "./team";
import type { TextRequestType } from "./types";
import type { User } from "./user";

export interface AssignmentTarget {
  type: string;
  campaign: Campaign;
  countLeft?: number | null;
  teamTitle: string;
  teamId: string;
  enabled: boolean;
  maxRequestCount?: number | null;
}

export interface Organization {
  id: string;
  uuid: string;
  name: string;
  campaigns: PaginatedCampaigns;
  campaignsRelay: RelayPaginatedResponse<Campaign>;
  memberships: RelayPaginatedResponse<OrganizationMembership>;
  people: User[];
  peopleCount: number;
  optOuts: OptOut[];
  threeClickEnabled: boolean;
  optOutMessage: string;
  defaultTextingTz: string;
  textingHoursEnforced: boolean;
  textingHoursStart: number;
  textingHoursEnd: number;
  textRequestFormEnabled: boolean;
  textRequestType: TextRequestType;
  textRequestMaxCount: number;
  textsAvailable: boolean;
  pendingAssignmentRequestCount: number;
  currentAssignmentTargets: AssignmentTarget[];
  myCurrentAssignmentTarget: AssignmentTarget[];
  myCurrentAssignmentTargets: AssignmentTarget[];
  escalatedConversationCount: number;
  linkDomains: LinkDomain[];
  unhealthyLinkDomains: UnhealthyLinkDomain[];
  numbersApiKey: string;
  settings: OrganizationSettings;
  tagList: Tag[];
  escalationTagList: Tag[];
  teams: Team[];
  externalSystems: RelayPaginatedResponse<ExternalSystem>;
  messagingServices: MessagingServicePage;
  campaignGroups: CampaignGroupPage;
  deletedAt: string;
  deletedBy: User;
}

export interface EditOrganizationInput {
  name?: string | null;
}

export const schema = `
  enum TextRequestType {
    UNSENT
    UNREPLIED
  }

  enum DeactivateMode {
    NOSUSPEND
    SUSPENDALL
    DELETEALL
  }

  type AssignmentTarget {
    type: String!
    campaign: Campaign
    countLeft: Int
    teamTitle: String
    teamId: String
    enabled: Boolean
    maxRequestCount: Int
  }

  type Organization {
    id: ID
    uuid: String
    name: String
    campaigns(cursor:OffsetLimitCursor, campaignsFilter: CampaignsFilter): PaginatedCampaigns!
    campaignsRelay(after: Cursor, first: Int, filter: CampaignsFilter): CampaignPage!
    memberships(after: Cursor, first: Int, filter: MembershipFilter): OrganizationMembershipPage
    people(role: String, campaignId: String, offset: Int): [User]
    peopleCount: Int
    optOuts: [OptOut]
    threeClickEnabled: Boolean
    optOutMessage: String
    defaultTextingTz: String!
    textingHoursEnforced: Boolean
    textingHoursStart: Int
    textingHoursEnd: Int
    textRequestFormEnabled: Boolean
    textRequestType: TextRequestType
    textRequestMaxCount: Int
    textsAvailable: Boolean
    pendingAssignmentRequestCount: Int!
    currentAssignmentTargets: [AssignmentTarget]!
    myCurrentAssignmentTarget: AssignmentTarget
    myCurrentAssignmentTargets: [AssignmentTarget]!
    escalatedConversationCount: Int!
    linkDomains: [LinkDomain]!
    unhealthyLinkDomains: [UnhealthyLinkDomain]!
    numbersApiKey: String
    settings: OrganizationSettings!
    tagList: [Tag]
    escalationTagList: [Tag]
    teams: [Team]!
    externalSystems(after: Cursor, first: Int): ExternalSystemPage!
    messagingServices(after: Cursor, first: Int, active: Boolean): MessagingServicePage
    campaignGroups(after: Cursor, first: Int): CampaignGroupPage!
    templateCampaigns(after: Cursor, first: Int): CampaignPage!
    deletedAt: String
    deletedBy: User
  }

  input EditOrganizationInput {
    name: String
  }
`;
