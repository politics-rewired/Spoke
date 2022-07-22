/* eslint-disable no-unused-vars */
import type { CampaignContactInput } from "./campaign-contact";
import type { CampaignGroupPage } from "./campaign-group";
import type {
  CampaignVariableInput,
  CampaignVariablePage
} from "./campaign-variable";
import type { CannedResponseInput } from "./canned-response";
import type { ExternalSystem } from "./external-system";
import type {
  InteractionStep,
  InteractionStepWithChildren
} from "./interaction-step";
import type { Team } from "./team";
import type { PageInfo } from "./types";
import type { User } from "./user";

export enum ExternalSyncReadinessState {
  READY = "READY",
  MISSING_SYSTEM = "MISSING_SYSTEM",
  MISSING_REQUIRED_MAPPING = "MISSING_REQUIRED_MAPPING",
  INCLUDES_NOT_ACTIVE_TARGETS = "INCLUDES_NOT_ACTIVE_TARGETS"
}

export interface JobRequest {
  id: string;
  jobType: string;
  assigned: boolean;
  status: number;
  resultMessage: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliverabilityErrorStat {
  errorCode: string | null;
  count: number;
}

export interface CampaignDeliverabilityStats {
  deliveredCount: number;
  sendingCount: number;
  sentCount: number;
  errorCount: number;
  specificErrors: DeliverabilityErrorStat[];
}

export interface CampaignsFilter {
  isArchived?: boolean;
  organizationId?: number;
  campaignId?: number;
}

export interface TexterAssignmentInput {
  userId: string;
  contactsCount: number;
}

export interface TexterInput {
  assignmentInputs: TexterAssignmentInput[];
  ignoreAfterDate: string;
}

export interface CampaignInput {
  title: string | null;
  description: string | null;
  dueBy: string | null;
  logoImageUrl: string | null;
  primaryColor: string | null;
  introHtml: string | null;
  externalSystemId: string | null;
  useDynamicAssignment: boolean | null;
  contacts: CampaignContactInput[] | null;
  contactsFile: any | null;
  externalListId: string | null;
  filterOutLandlines: boolean | null;
  excludeCampaignIds: number[] | null;
  contactSql: string | null;
  organizationId: string | null;
  isAssignmentLimitedToTeams: boolean | null;
  teamIds: string[];
  campaignGroupIds: string[] | null;
  texters: TexterInput | null;
  campaignVariables: CampaignVariableInput[] | null;
  interactionSteps: InteractionStepWithChildren;
  cannedResponses: CannedResponseInput[];
  textingHoursStart: number | null;
  textingHoursEnd: number | null;
  isAutoassignEnabled: boolean | null;
  timezone: string | null;
  repliesStaleAfter: number | null;
  messagingServiceSid: string | null;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  isStarted: boolean;
  dueBy?: string | null;
  contactsCount: number;
  isApproved: boolean;
  isArchived: boolean;
  textingHoursStart: number;
  textingHoursEnd: number;
  timezone: string;
  isAutoassignEnabled: boolean;
  isAssignmentLimitedToTeams: boolean;
  landlinesFiltered: boolean;
  syncReadiness: ExternalSyncReadinessState;
  pendingJobs: JobRequest[];
  interactionSteps: InteractionStep[];
  invalidScriptFields: string[];
  customFields: string[];
  hasUnassignedContacts?: boolean | null;
  primaryColor?: string | null;
  logoImageUrl?: string | null;
  introHtml?: string | null;
  useDynamicAssignment?: boolean | null;
  hasUnsentInitialMessages?: boolean | null;
  hasUnhandledMessages?: boolean | null;
  teams: Team[];
  campaignGroups?: CampaignGroupPage | null;
  campaignVariables: CampaignVariablePage;
  externalSystem?: ExternalSystem | null;
  creator?: User | null;
  deliverabilityStats: CampaignDeliverabilityStats;
  previewUrl?: string | null;
  messagingServiceSid?: string | null;
}

export interface PaginatedCampaigns {
  campaigns: Campaign[];
  pageInfo: PageInfo;
}

export interface CampaignsList {
  campaigns: Campaign[];
}

export interface CampaignNavigation {
  nextCampaignId: string | null;
  prevCampaignId: string | null;
}

export type CampaignsReturn = PaginatedCampaigns | CampaignsList;

export const schema = `
  input CampaignsFilter {
    isArchived: Boolean
    isStarted: Boolean
    organizationId: Int
    campaignId: Int
    listSize: Int
    pageSize: Int
    campaignTitle: String
  }

  type CampaignStats {
    sentMessagesCount: Int!
    receivedMessagesCount: Int!
    optOutsCount: Int!
    needsMessageOptOutsCount: Int!
    percentUnhandledReplies: Float!
    countMessagedContacts: Int!
    countNeedsMessageContacts: Int!
  }

  type DeliverabilityErrorStat {
    errorCode: String
    count: Int!
  }

  input CampaignDeliverabilityStatsFilter {
    initialMessagesOnly: Boolean
  }

  type CampaignDeliverabilityStats {
    deliveredCount: Int!
    sendingCount: Int!
    sentCount: Int!
    errorCount: Int!
    specificErrors: [DeliverabilityErrorStat]
  }

  type JobRequest {
    id: String!
    jobType: String!
    assigned: Boolean
    status: Int
    resultMessage: String
    createdAt: Date!
    updatedAt: Date!
  }

  type CampaignReadiness {
    id: ID!
    basics: Boolean!
    messagingService: Boolean!
    textingHours: Boolean!
    integration: Boolean!
    contacts: Boolean!
    autoassign: Boolean!
    cannedResponses: Boolean!
    campaignGroups: Boolean!
    campaignVariables: Boolean!
    interactions: Boolean!
    texters: Boolean!
  }

  enum ExternalSyncReadinessState {
    READY
    MISSING_SYSTEM
    MISSING_REQUIRED_MAPPING
    INCLUDES_NOT_ACTIVE_TARGETS
  }

  type Campaign {
    id: ID!
    organization: Organization!
    title: String!
    description: String!
    dueBy: Date
    readiness: CampaignReadiness!
    isApproved: Boolean!
    isStarted: Boolean
    isArchived: Boolean
    isTemplate: Boolean!
    creator: User
    texters: [User]
    assignments(assignmentsFilter: AssignmentsFilter): [Assignment]
    interactionSteps: [InteractionStep]
    invalidScriptFields: [String!]!
    contacts: [CampaignContact]
    contactsCount: Int
    hasUnassignedContacts: Boolean
    hasUnsentInitialMessages: Boolean
    hasUnhandledMessages: Boolean
    customFields: [String]
    cannedResponses(userId: String): [CannedResponse!]!
    stats: CampaignStats,
    pendingJobs(jobTypes: [String]): [JobRequest]!
    datawarehouseAvailable: Boolean
    useDynamicAssignment: Boolean
    introHtml: String
    primaryColor: String
    logoImageUrl: String
    editors: String
    teams: [Team!]!
    campaignGroups: CampaignGroupPage
    campaignVariables: CampaignVariablePage!
    textingHoursStart: Int
    textingHoursEnd: Int
    isAutoassignEnabled: Boolean!
    repliesStaleAfter: Int
    isAssignmentLimitedToTeams: Boolean!
    timezone: String
    createdAt: Date!
    previewUrl: String
    landlinesFiltered: Boolean!
    externalSystem: ExternalSystem
    syncReadiness: ExternalSyncReadinessState!
    externalSyncConfigurations(after: Cursor, first: Int): ExternalSyncQuestionResponseConfigPage!
    deliverabilityStats(filter: CampaignDeliverabilityStatsFilter): CampaignDeliverabilityStats!
    autosendStatus: String!
    messagingServiceSid: String
  }

  type CampaignEdge {
    cursor: Cursor!
    node: Campaign!
  }

  type CampaignPage {
    edges: [CampaignEdge!]!
    pageInfo: RelayPageInfo!
  }

  type CampaignsList {
    campaigns: [Campaign]
  }

  union CampaignsReturn = PaginatedCampaigns | CampaignsList

  type PaginatedCampaigns {
    campaigns: [Campaign!]!
    pageInfo: PageInfo!
  }

  type CampaignNavigation {
    nextCampaignId: String
    prevCampaignId: String
  }

  input TexterAssignmentInput {
    userId: String!
    contactsCount: Int!
  }

  input TexterInput {
    assignmentInputs: [TexterAssignmentInput!]!
    ignoreAfterDate: Date!
  }

  input CampaignInput {
    title: String
    description: String
    dueBy: Date
    logoImageUrl: String
    primaryColor: String
    introHtml: String
    externalSystemId: String
    useDynamicAssignment: Boolean
    contacts: [CampaignContactInput]
    contactsFile: Upload
    externalListId: String
    filterOutLandlines: Boolean
    excludeCampaignIds: [String!]
    contactSql: String
    organizationId: String
    isAssignmentLimitedToTeams: Boolean
    teamIds: [ID]
    campaignGroupIds: [String!]
    campaignVariables: [CampaignVariableInput!]
    texters: TexterInput
    interactionSteps: InteractionStepInput
    cannedResponses: [CannedResponseInput]
    textingHoursStart: Int
    textingHoursEnd: Int
    isAutoassignEnabled: Boolean
    timezone: String
    repliesStaleAfter: Int
    messagingServiceSid: String
  }
`;
