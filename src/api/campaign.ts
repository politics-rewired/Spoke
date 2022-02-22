/* eslint-disable no-unused-vars */
import { CampaignContactInput } from "./campaign-contact";
import { CampaignGroupPage } from "./campaign-group";
import { CannedResponseInput } from "./canned-response";
import { ExternalSystem } from "./external-system";
import {
  InteractionStep,
  InteractionStepWithChildren
} from "./interaction-step";
import { Team } from "./team";
import { PageInfo } from "./types";
import { User } from "./user";

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
  texters: TexterInput;
  interactionSteps: InteractionStepWithChildren;
  cannedResponses: CannedResponseInput[];
  textingHoursStart: number | null;
  textingHoursEnd: number | null;
  isAutoassignEnabled: boolean | null;
  timezone: string | null;
  repliesStaleAfter: number | null;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  isStarted: boolean;
  dueBy?: string | null;
  contactsCount: number;
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
  customFields: string[];
  hasUnassignedContacts?: boolean | null;
  primaryColor?: string | null;
  logoImageUrl?: string | null;
  introHtml?: string | null;
  useDynamicAssignment?: boolean | null;
  hasUnsentInitialMessages?: boolean | null;
  hasUnhandledMessages?: boolean | null;
  teams: Team[];
  campaignGroups: CampaignGroupPage;
  externalSystem?: ExternalSystem | null;
  creator?: User | null;
  deliverabilityStats: CampaignDeliverabilityStats;
}

export interface PaginatedCampaigns {
  campaigns: Campaign[];
  pageInfo: PageInfo;
}

export interface CampaignsList {
  campaigns: Campaign[];
}

export type CampaignsReturn = PaginatedCampaigns | CampaignsList;

export const schema = `
  input CampaignsFilter {
    isArchived: Boolean
    organizationId: Int
    campaignId: Int
    listSize: Int
    pageSize: Int
  }

  type CampaignStats {
    sentMessagesCount: Int
    receivedMessagesCount: Int
    optOutsCount: Int
  }

  type DeliverabilityErrorStat {
    errorCode: String
    count: Int!
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
    textingHours: Boolean!
    integration: Boolean!
    contacts: Boolean!
    autoassign: Boolean!
    cannedResponses: Boolean!
    campaignGroups: Boolean!
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
    id: ID
    organization: Organization
    title: String
    description: String
    dueBy: Date
    readiness: CampaignReadiness!
    isStarted: Boolean
    isArchived: Boolean
    creator: User
    texters: [User]
    assignments(assignmentsFilter: AssignmentsFilter): [Assignment]
    interactionSteps: [InteractionStep]
    contacts: [CampaignContact]
    contactsCount: Int
    hasUnassignedContacts: Boolean
    hasUnsentInitialMessages: Boolean
    hasUnhandledMessages: Boolean
    customFields: [String]
    cannedResponses(userId: String): [CannedResponse]
    stats: CampaignStats,
    pendingJobs(jobTypes: [String]): [JobRequest]!
    datawarehouseAvailable: Boolean
    useDynamicAssignment: Boolean
    introHtml: String
    primaryColor: String
    logoImageUrl: String
    editors: String
    teams: [Team]!
    campaignGroups: CampaignGroupPage!
    textingHoursStart: Int
    textingHoursEnd: Int
    isAutoassignEnabled: Boolean!
    repliesStaleAfter: Int
    isAssignmentLimitedToTeams: Boolean!
    timezone: String
    createdAt: Date
    previewUrl: String
    landlinesFiltered: Boolean!
    externalSystem: ExternalSystem
    syncReadiness: ExternalSyncReadinessState!
    externalSyncConfigurations(after: Cursor, first: Int): ExternalSyncQuestionResponseConfigPage!
    deliverabilityStats: CampaignDeliverabilityStats!
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
    campaigns: [Campaign]
    pageInfo: PageInfo
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
    texters: TexterInput
    interactionSteps: InteractionStepInput
    cannedResponses: [CannedResponseInput]
    textingHoursStart: Int
    textingHoursEnd: Int
    isAutoassignEnabled: Boolean
    timezone: String
    repliesStaleAfter: Int
  }
`;
