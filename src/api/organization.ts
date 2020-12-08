import { Campaign, CampaignsFilter } from "./campaign";
import { ExternalSystem } from "./external-system";
import {
  MembershipFilter,
  OrganizationMembership
} from "./organization-membership";
import { OranizationSettings } from "./organization-settings";
import { RelayPaginatedResponse } from "./pagination";
import { Tag } from "./tag";

export const TextRequestType = Object.freeze({
  UNSENT: "UNSENT",
  UNREPLIED: "UNREPLIED"
});

export interface Organization {
  id: string;
  uuid: string;
  name: string;
  campaigns(cursor: any, campaignsFilter: CampaignsFilter): any;
  campaignsRelay(
    after?: string,
    first?: number,
    filter?: CampaignsFilter
  ): RelayPaginatedResponse<Campaign>;
  memberships(
    after?: string,
    first?: number,
    filter?: MembershipFilter
  ): RelayPaginatedResponse<OrganizationMembership>;
  people(role?: string, campaignId?: string, offset?: number): any[];
  peopleCount: number;
  optOuts: any[];
  threeClickEnabled: boolean;
  optOutMessage: string;
  textingHoursEnforced: boolean;
  textingHoursStart: number;
  textingHoursEnd: number;
  textRequestFormEnabled: boolean;
  textRequestType: string;
  textRequestMaxCount: number;
  textsAvailable: boolean;
  pendingAssignmentRequestCount: number;
  currentAssignmentTargets: any[];
  myCurrentAssignmentTarget: any[];
  myCurrentAssignmentTargets: any[];
  escalatedConversationCount: number;
  linkDomains: any[];
  unhealthyLinkDomains: any[];
  numbersApiKey: string;
  settings: OranizationSettings;
  tagList: Tag[];
  escalationTagList: Tag[];
  teams: any[];
  externalSystems(
    after?: string,
    first?: number
  ): RelayPaginatedResponse<ExternalSystem>;
}

export const schema = `
  enum TextRequestType {
    UNSENT
    UNREPLIED
  }

  type AssignmentTarget {
    type: String!
    campaign: Campaign
    countLeft: Int
    teamTitle: String
    teamId: Int
    enabled: Boolean
    maxRequestCount: Int
  }

  type Organization {
    id: ID
    uuid: String
    name: String
    campaigns(cursor:OffsetLimitCursor, campaignsFilter: CampaignsFilter): PaginatedCampaigns
    campaignsRelay(after: Cursor, first: Int, filter: CampaignsFilter): CampaignPage!
    memberships(after: Cursor, first: Int, filter: MembershipFilter): OrganizationMembershipPage
    people(role: String, campaignId: String, offset: Int): [User]
    peopleCount: Int
    optOuts: [OptOut]
    threeClickEnabled: Boolean
    optOutMessage: String
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
    settings: OranizationSettings!
    tagList: [Tag]
    escalationTagList: [Tag]
    teams: [Team]!
    externalSystems(after: Cursor, first: Int): ExternalSystemPage!
  }
`;
