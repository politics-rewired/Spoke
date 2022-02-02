import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = { [X in Exclude<keyof T, K>]?: T[X] } & { [P in K]-?: NonNullable<T[P]> };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  Cursor: any;
  Date: any;
  JSON: any;
  Phone: any;
  Upload: any;
};

export type Action = {
  __typename?: 'Action';
  display_name?: Maybe<Scalars['String']>;
  instructions?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
};

export type AnswerOption = {
  __typename?: 'AnswerOption';
  action?: Maybe<Scalars['String']>;
  interactionStepId?: Maybe<Scalars['Int']>;
  nextInteractionStep?: Maybe<InteractionStep>;
  question?: Maybe<Question>;
  responderCount?: Maybe<Scalars['Int']>;
  responders?: Maybe<Array<Maybe<CampaignContact>>>;
  value?: Maybe<Scalars['String']>;
};

export type AnswerOptionInput = {
  action?: InputMaybe<Scalars['String']>;
  nextInteractionStepId?: InputMaybe<Scalars['String']>;
  value: Scalars['String'];
};

export type Assignment = {
  __typename?: 'Assignment';
  campaign?: Maybe<Campaign>;
  campaignCannedResponses?: Maybe<Array<Maybe<CannedResponse>>>;
  contacts?: Maybe<Array<Maybe<CampaignContact>>>;
  contactsCount?: Maybe<Scalars['Int']>;
  id?: Maybe<Scalars['ID']>;
  maxContacts?: Maybe<Scalars['Int']>;
  texter?: Maybe<User>;
  userCannedResponses?: Maybe<Array<Maybe<CannedResponse>>>;
};


export type AssignmentContactsArgs = {
  contactsFilter?: InputMaybe<ContactsFilter>;
};


export type AssignmentContactsCountArgs = {
  contactsFilter?: InputMaybe<ContactsFilter>;
};

export type AssignmentRequest = {
  __typename?: 'AssignmentRequest';
  amount: Scalars['Int'];
  createdAt: Scalars['Date'];
  id: Scalars['ID'];
  organization: Organization;
  status: Scalars['String'];
  updatedAt: Scalars['Date'];
  user: User;
};

export type AssignmentTarget = {
  __typename?: 'AssignmentTarget';
  campaign?: Maybe<Campaign>;
  countLeft?: Maybe<Scalars['Int']>;
  enabled?: Maybe<Scalars['Boolean']>;
  maxRequestCount?: Maybe<Scalars['Int']>;
  teamId?: Maybe<Scalars['Int']>;
  teamTitle?: Maybe<Scalars['String']>;
  type: Scalars['String'];
};

export type AssignmentsFilter = {
  includeEscalated?: InputMaybe<Scalars['Boolean']>;
  texterId?: InputMaybe<Scalars['Int']>;
};

export type BulkUpdateScriptInput = {
  campaignTitlePrefixes: Array<InputMaybe<Scalars['String']>>;
  includeArchived: Scalars['Boolean'];
  replaceString: Scalars['String'];
  searchString: Scalars['String'];
};

export type Campaign = {
  __typename?: 'Campaign';
  assignments?: Maybe<Array<Maybe<Assignment>>>;
  campaignGroups: CampaignGroupPage;
  cannedResponses?: Maybe<Array<Maybe<CannedResponse>>>;
  contacts?: Maybe<Array<Maybe<CampaignContact>>>;
  contactsCount?: Maybe<Scalars['Int']>;
  createdAt?: Maybe<Scalars['Date']>;
  creator?: Maybe<User>;
  customFields?: Maybe<Array<Maybe<Scalars['String']>>>;
  datawarehouseAvailable?: Maybe<Scalars['Boolean']>;
  deliverabilityStats: CampaignDeliverabilityStats;
  description?: Maybe<Scalars['String']>;
  dueBy?: Maybe<Scalars['Date']>;
  editors?: Maybe<Scalars['String']>;
  externalSyncConfigurations: ExternalSyncQuestionResponseConfigPage;
  externalSystem?: Maybe<ExternalSystem>;
  hasUnassignedContacts?: Maybe<Scalars['Boolean']>;
  hasUnhandledMessages?: Maybe<Scalars['Boolean']>;
  hasUnsentInitialMessages?: Maybe<Scalars['Boolean']>;
  id?: Maybe<Scalars['ID']>;
  interactionSteps?: Maybe<Array<Maybe<InteractionStep>>>;
  introHtml?: Maybe<Scalars['String']>;
  isArchived?: Maybe<Scalars['Boolean']>;
  isAssignmentLimitedToTeams: Scalars['Boolean'];
  isAutoassignEnabled: Scalars['Boolean'];
  isStarted?: Maybe<Scalars['Boolean']>;
  landlinesFiltered: Scalars['Boolean'];
  logoImageUrl?: Maybe<Scalars['String']>;
  organization?: Maybe<Organization>;
  pendingJobs: Array<Maybe<JobRequest>>;
  previewUrl?: Maybe<Scalars['String']>;
  primaryColor?: Maybe<Scalars['String']>;
  readiness: CampaignReadiness;
  repliesStaleAfter?: Maybe<Scalars['Int']>;
  stats?: Maybe<CampaignStats>;
  syncReadiness: ExternalSyncReadinessState;
  teams: Array<Maybe<Team>>;
  texters?: Maybe<Array<Maybe<User>>>;
  textingHoursEnd?: Maybe<Scalars['Int']>;
  textingHoursStart?: Maybe<Scalars['Int']>;
  timezone?: Maybe<Scalars['String']>;
  title?: Maybe<Scalars['String']>;
  useDynamicAssignment?: Maybe<Scalars['Boolean']>;
};


export type CampaignAssignmentsArgs = {
  assignmentsFilter?: InputMaybe<AssignmentsFilter>;
};


export type CampaignCannedResponsesArgs = {
  userId?: InputMaybe<Scalars['String']>;
};


export type CampaignExternalSyncConfigurationsArgs = {
  after?: InputMaybe<Scalars['Cursor']>;
  first?: InputMaybe<Scalars['Int']>;
};


export type CampaignPendingJobsArgs = {
  jobTypes?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
};

export type CampaignContact = {
  __typename?: 'CampaignContact';
  assignmentId?: Maybe<Scalars['String']>;
  campaign?: Maybe<Campaign>;
  cell?: Maybe<Scalars['Phone']>;
  contactTags?: Maybe<Array<Maybe<Tag>>>;
  customFields?: Maybe<Scalars['JSON']>;
  external_id?: Maybe<Scalars['String']>;
  firstName?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['ID']>;
  interactionSteps?: Maybe<Array<Maybe<InteractionStep>>>;
  lastName?: Maybe<Scalars['String']>;
  location?: Maybe<Location>;
  messageStatus?: Maybe<Scalars['String']>;
  messages?: Maybe<Array<Maybe<Message>>>;
  optOut?: Maybe<OptOut>;
  questionResponseValues?: Maybe<Array<Maybe<AnswerOption>>>;
  questionResponses?: Maybe<Array<Maybe<AnswerOption>>>;
  timezone?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['Date']>;
  zip?: Maybe<Scalars['String']>;
};

export type CampaignContactInput = {
  cell: Scalars['String'];
  customFields?: InputMaybe<Scalars['String']>;
  external_id?: InputMaybe<Scalars['String']>;
  firstName: Scalars['String'];
  lastName: Scalars['String'];
  zip?: InputMaybe<Scalars['String']>;
};

export type CampaignDeliverabilityStats = {
  __typename?: 'CampaignDeliverabilityStats';
  deliveredCount: Scalars['Int'];
  errorCount: Scalars['Int'];
  sendingCount: Scalars['Int'];
  sentCount: Scalars['Int'];
  specificErrors?: Maybe<Array<Maybe<DeliverabilityErrorStat>>>;
};

export type CampaignEdge = {
  __typename?: 'CampaignEdge';
  cursor: Scalars['Cursor'];
  node: Campaign;
};

export type CampaignExportInput = {
  campaignId: Scalars['String'];
  exportType: CampaignExportType;
  vanOptions?: InputMaybe<ExportForVanInput>;
};

export enum CampaignExportType {
  Spoke = 'SPOKE',
  Van = 'VAN'
}

export type CampaignGroup = {
  __typename?: 'CampaignGroup';
  campaigns: CampaignPage;
  createdAt: Scalars['String'];
  description: Scalars['String'];
  id: Scalars['ID'];
  name: Scalars['String'];
  organizationId: Scalars['String'];
  updatedAt: Scalars['String'];
};

export type CampaignGroupEdge = {
  __typename?: 'CampaignGroupEdge';
  cursor: Scalars['Cursor'];
  node: CampaignGroup;
};

export type CampaignGroupInput = {
  description: Scalars['String'];
  id?: InputMaybe<Scalars['String']>;
  name: Scalars['String'];
};

export type CampaignGroupPage = {
  __typename?: 'CampaignGroupPage';
  edges: Array<CampaignGroupEdge>;
  pageInfo: RelayPageInfo;
};

export type CampaignIdContactId = {
  campaignContactId: Scalars['String'];
  campaignId: Scalars['String'];
  messageIds: Array<InputMaybe<Scalars['String']>>;
};

export type CampaignInput = {
  campaignGroupIds?: InputMaybe<Array<Scalars['String']>>;
  cannedResponses?: InputMaybe<Array<InputMaybe<CannedResponseInput>>>;
  contactSql?: InputMaybe<Scalars['String']>;
  contacts?: InputMaybe<Array<InputMaybe<CampaignContactInput>>>;
  contactsFile?: InputMaybe<Scalars['Upload']>;
  description?: InputMaybe<Scalars['String']>;
  dueBy?: InputMaybe<Scalars['Date']>;
  excludeCampaignIds?: InputMaybe<Array<InputMaybe<Scalars['Int']>>>;
  externalListId?: InputMaybe<Scalars['String']>;
  externalSystemId?: InputMaybe<Scalars['String']>;
  filterOutLandlines?: InputMaybe<Scalars['Boolean']>;
  interactionSteps?: InputMaybe<InteractionStepInput>;
  introHtml?: InputMaybe<Scalars['String']>;
  isAssignmentLimitedToTeams?: InputMaybe<Scalars['Boolean']>;
  isAutoassignEnabled?: InputMaybe<Scalars['Boolean']>;
  logoImageUrl?: InputMaybe<Scalars['String']>;
  organizationId?: InputMaybe<Scalars['String']>;
  primaryColor?: InputMaybe<Scalars['String']>;
  repliesStaleAfter?: InputMaybe<Scalars['Int']>;
  teamIds?: InputMaybe<Array<InputMaybe<Scalars['ID']>>>;
  texters?: InputMaybe<TexterInput>;
  textingHoursEnd?: InputMaybe<Scalars['Int']>;
  textingHoursStart?: InputMaybe<Scalars['Int']>;
  timezone?: InputMaybe<Scalars['String']>;
  title?: InputMaybe<Scalars['String']>;
  useDynamicAssignment?: InputMaybe<Scalars['Boolean']>;
};

export type CampaignPage = {
  __typename?: 'CampaignPage';
  edges: Array<CampaignEdge>;
  pageInfo: RelayPageInfo;
};

export type CampaignReadiness = {
  __typename?: 'CampaignReadiness';
  autoassign: Scalars['Boolean'];
  basics: Scalars['Boolean'];
  campaignGroups: Scalars['Boolean'];
  cannedResponses: Scalars['Boolean'];
  contacts: Scalars['Boolean'];
  id: Scalars['ID'];
  integration: Scalars['Boolean'];
  interactions: Scalars['Boolean'];
  texters: Scalars['Boolean'];
  textingHours: Scalars['Boolean'];
};

export type CampaignStats = {
  __typename?: 'CampaignStats';
  optOutsCount?: Maybe<Scalars['Int']>;
  receivedMessagesCount?: Maybe<Scalars['Int']>;
  sentMessagesCount?: Maybe<Scalars['Int']>;
};

export type CampaignsFilter = {
  campaignId?: InputMaybe<Scalars['Int']>;
  isArchived?: InputMaybe<Scalars['Boolean']>;
  listSize?: InputMaybe<Scalars['Int']>;
  organizationId?: InputMaybe<Scalars['Int']>;
  pageSize?: InputMaybe<Scalars['Int']>;
};

export type CampaignsList = {
  __typename?: 'CampaignsList';
  campaigns?: Maybe<Array<Maybe<Campaign>>>;
};

export type CampaignsReturn = CampaignsList | PaginatedCampaigns;

export type CannedResponse = {
  __typename?: 'CannedResponse';
  id?: Maybe<Scalars['ID']>;
  isUserCreated?: Maybe<Scalars['Boolean']>;
  text?: Maybe<Scalars['String']>;
  title?: Maybe<Scalars['String']>;
};

export type CannedResponseInput = {
  campaignId?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['String']>;
  text?: InputMaybe<Scalars['String']>;
  title?: InputMaybe<Scalars['String']>;
  userId?: InputMaybe<Scalars['String']>;
};

export type ContactActionInput = {
  assignmentId?: InputMaybe<Scalars['String']>;
  cell: Scalars['Phone'];
  message?: InputMaybe<MessageInput>;
  reason?: InputMaybe<Scalars['String']>;
};

export type ContactMessage = {
  campaignContactId: Scalars['String'];
  message: MessageInput;
};

export type ContactNameFilter = {
  firstName?: InputMaybe<Scalars['String']>;
  lastName?: InputMaybe<Scalars['String']>;
};

export type ContactTagActionInput = {
  addedTagIds: Array<InputMaybe<Scalars['String']>>;
  message?: InputMaybe<MessageInput>;
  removedTagIds: Array<InputMaybe<Scalars['String']>>;
};

export type ContactsFilter = {
  includePastDue?: InputMaybe<Scalars['Boolean']>;
  isOptedOut?: InputMaybe<Scalars['Boolean']>;
  messageStatus?: InputMaybe<Scalars['String']>;
  validTimezone?: InputMaybe<Scalars['Boolean']>;
};

export type Conversation = {
  __typename?: 'Conversation';
  campaign: Campaign;
  contact: CampaignContact;
  texter: User;
};

export type ConversationFilter = {
  assignmentsFilter?: InputMaybe<AssignmentsFilter>;
  campaignsFilter?: InputMaybe<CampaignsFilter>;
  contactsFilter?: InputMaybe<ContactsFilter>;
};

export type DeleteCampaignOverlapResult = {
  __typename?: 'DeleteCampaignOverlapResult';
  campaign?: Maybe<Campaign>;
  deletedRowCount: Scalars['Int'];
  remainingCount: Scalars['Int'];
};

export type DeliverabilityErrorStat = {
  __typename?: 'DeliverabilityErrorStat';
  count: Scalars['Int'];
  errorCode?: Maybe<Scalars['String']>;
};

export type EditOrganizationInput = {
  name?: InputMaybe<Scalars['String']>;
};

export type ExportForVanInput = {
  includeUnmessaged: Scalars['Boolean'];
  vanIdField: Scalars['String'];
};

export type ExternalActivistCode = {
  __typename?: 'ExternalActivistCode';
  createdAt: Scalars['Date'];
  description?: Maybe<Scalars['String']>;
  externalId: Scalars['String'];
  id: Scalars['String'];
  mediumName: Scalars['String'];
  name: Scalars['String'];
  scriptQuestion?: Maybe<Scalars['String']>;
  shortName: Scalars['String'];
  status: ExternalDataCollectionStatus;
  systemId: Scalars['String'];
  type: Scalars['String'];
  updatedAt: Scalars['Date'];
};

export type ExternalActivistCodeEdge = {
  __typename?: 'ExternalActivistCodeEdge';
  cursor: Scalars['Cursor'];
  node: ExternalActivistCode;
};

export type ExternalActivistCodeFilter = {
  status?: InputMaybe<ExternalDataCollectionStatus>;
};

export type ExternalActivistCodePage = {
  __typename?: 'ExternalActivistCodePage';
  edges: Array<ExternalActivistCodeEdge>;
  pageInfo: RelayPageInfo;
};

export type ExternalActivistCodeTarget = {
  __typename?: 'ExternalActivistCodeTarget';
  activistCode: ExternalActivistCode;
  id: Scalars['String'];
};

export enum ExternalDataCollectionStatus {
  Active = 'ACTIVE',
  Archived = 'ARCHIVED',
  Inactive = 'INACTIVE'
}

export type ExternalList = {
  __typename?: 'ExternalList';
  createdAt: Scalars['Date'];
  description: Scalars['String'];
  doorCount: Scalars['Int'];
  externalId: Scalars['String'];
  listCount: Scalars['Int'];
  name: Scalars['String'];
  systemId: Scalars['String'];
  updatedAt: Scalars['Date'];
};

export type ExternalListEdge = {
  __typename?: 'ExternalListEdge';
  cursor: Scalars['Cursor'];
  node: ExternalList;
};

export type ExternalListPage = {
  __typename?: 'ExternalListPage';
  edges: Array<ExternalListEdge>;
  pageInfo: RelayPageInfo;
};

export type ExternalResultCode = {
  __typename?: 'ExternalResultCode';
  createdAt: Scalars['Date'];
  externalId: Scalars['String'];
  id: Scalars['String'];
  mediumName: Scalars['String'];
  name: Scalars['String'];
  shortName: Scalars['String'];
  systemId: Scalars['String'];
  updatedAt: Scalars['Date'];
};

export type ExternalResultCodeEdge = {
  __typename?: 'ExternalResultCodeEdge';
  cursor: Scalars['Cursor'];
  node: ExternalResultCode;
};

export type ExternalResultCodePage = {
  __typename?: 'ExternalResultCodePage';
  edges: Array<ExternalResultCodeEdge>;
  pageInfo: RelayPageInfo;
};

export type ExternalResultCodeTarget = {
  __typename?: 'ExternalResultCodeTarget';
  id: Scalars['String'];
  resultCode: ExternalResultCode;
};

export type ExternalSurveyQuestion = {
  __typename?: 'ExternalSurveyQuestion';
  createdAt: Scalars['Date'];
  cycle: Scalars['Int'];
  externalId: Scalars['String'];
  id: Scalars['String'];
  mediumName: Scalars['String'];
  name: Scalars['String'];
  responseOptions: ExternalSurveyQuestionResponseOptionPage;
  scriptQuestion: Scalars['String'];
  shortName: Scalars['String'];
  status: ExternalDataCollectionStatus;
  systemId: Scalars['String'];
  type: Scalars['String'];
  updatedAt: Scalars['Date'];
};


export type ExternalSurveyQuestionResponseOptionsArgs = {
  after?: InputMaybe<Scalars['Cursor']>;
  first?: InputMaybe<Scalars['Int']>;
};

export type ExternalSurveyQuestionEdge = {
  __typename?: 'ExternalSurveyQuestionEdge';
  cursor: Scalars['Cursor'];
  node: ExternalSurveyQuestion;
};

export type ExternalSurveyQuestionFilter = {
  status?: InputMaybe<ExternalDataCollectionStatus>;
};

export type ExternalSurveyQuestionPage = {
  __typename?: 'ExternalSurveyQuestionPage';
  edges: Array<ExternalSurveyQuestionEdge>;
  pageInfo: RelayPageInfo;
};

export type ExternalSurveyQuestionResponseOption = {
  __typename?: 'ExternalSurveyQuestionResponseOption';
  createdAt: Scalars['Date'];
  externalId: Scalars['String'];
  externalSurveyQuestionId: Scalars['String'];
  id: Scalars['String'];
  mediumName: Scalars['String'];
  name: Scalars['String'];
  shortName: Scalars['String'];
  updatedAt: Scalars['Date'];
};

export type ExternalSurveyQuestionResponseOptionEdge = {
  __typename?: 'ExternalSurveyQuestionResponseOptionEdge';
  cursor: Scalars['Cursor'];
  node: ExternalSurveyQuestionResponseOption;
};

export type ExternalSurveyQuestionResponseOptionPage = {
  __typename?: 'ExternalSurveyQuestionResponseOptionPage';
  edges: Array<ExternalSurveyQuestionResponseOptionEdge>;
  pageInfo: RelayPageInfo;
};

export type ExternalSurveyQuestionResponseOptionTarget = {
  __typename?: 'ExternalSurveyQuestionResponseOptionTarget';
  id: Scalars['String'];
  responseOption: ExternalSurveyQuestionResponseOption;
};

export type ExternalSyncConfigTarget = ExternalActivistCodeTarget | ExternalResultCodeTarget | ExternalSurveyQuestionResponseOptionTarget;

export type ExternalSyncConfigTargetEdge = {
  __typename?: 'ExternalSyncConfigTargetEdge';
  cursor: Scalars['Cursor'];
  node: ExternalSyncConfigTarget;
};

export type ExternalSyncConfigTargetPage = {
  __typename?: 'ExternalSyncConfigTargetPage';
  edges: Array<ExternalSyncConfigTargetEdge>;
  pageInfo: RelayPageInfo;
};

export type ExternalSyncQuestionResponseConfig = {
  __typename?: 'ExternalSyncQuestionResponseConfig';
  campaignId: Scalars['String'];
  createdAt?: Maybe<Scalars['Date']>;
  id: Scalars['String'];
  includesNotActive: Scalars['Boolean'];
  interactionStep: InteractionStep;
  interactionStepId: Scalars['String'];
  isMissing: Scalars['Boolean'];
  isRequired: Scalars['Boolean'];
  questionResponseValue: Scalars['String'];
  targets?: Maybe<Array<Maybe<ExternalSyncConfigTarget>>>;
  updatedAt?: Maybe<Scalars['Date']>;
};


export type ExternalSyncQuestionResponseConfigTargetsArgs = {
  after?: InputMaybe<Scalars['Cursor']>;
  first?: InputMaybe<Scalars['Int']>;
};

export type ExternalSyncQuestionResponseConfigEdge = {
  __typename?: 'ExternalSyncQuestionResponseConfigEdge';
  cursor: Scalars['Cursor'];
  node: ExternalSyncQuestionResponseConfig;
};

export type ExternalSyncQuestionResponseConfigPage = {
  __typename?: 'ExternalSyncQuestionResponseConfigPage';
  edges: Array<ExternalSyncQuestionResponseConfigEdge>;
  pageInfo: RelayPageInfo;
};

export enum ExternalSyncReadinessState {
  IncludesNotActiveTargets = 'INCLUDES_NOT_ACTIVE_TARGETS',
  MissingRequiredMapping = 'MISSING_REQUIRED_MAPPING',
  MissingSystem = 'MISSING_SYSTEM',
  Ready = 'READY'
}

export type ExternalSyncTagConfig = {
  __typename?: 'ExternalSyncTagConfig';
  createdAt?: Maybe<Scalars['Date']>;
  id: Scalars['String'];
  includesNotActive: Scalars['Boolean'];
  isMissing: Scalars['Boolean'];
  isRequired: Scalars['Boolean'];
  systemId: Scalars['String'];
  tag: Tag;
  tagId: Scalars['String'];
  targets?: Maybe<ExternalSyncConfigTargetPage>;
  updatedAt?: Maybe<Scalars['Date']>;
};


export type ExternalSyncTagConfigTargetsArgs = {
  after?: InputMaybe<Scalars['Cursor']>;
  first?: InputMaybe<Scalars['Int']>;
};

export type ExternalSyncTagConfigEdge = {
  __typename?: 'ExternalSyncTagConfigEdge';
  cursor: Scalars['Cursor'];
  node: ExternalSyncTagConfig;
};

export type ExternalSyncTagConfigPage = {
  __typename?: 'ExternalSyncTagConfigPage';
  edges: Array<ExternalSyncTagConfigEdge>;
  pageInfo: RelayPageInfo;
};

export type ExternalSystem = {
  __typename?: 'ExternalSystem';
  activistCodes: ExternalActivistCodePage;
  apiKey: Scalars['String'];
  createdAt: Scalars['Date'];
  id: Scalars['String'];
  lists: ExternalListPage;
  name: Scalars['String'];
  operationMode: VanOperationMode;
  optOutSyncConfig?: Maybe<ExternalResultCodeTarget>;
  organizationId: Scalars['Int'];
  resultCodes: ExternalResultCodePage;
  surveyQuestions: ExternalSurveyQuestionPage;
  syncedAt?: Maybe<Scalars['Date']>;
  type: ExternalSystemType;
  updatedAt: Scalars['Date'];
  username: Scalars['String'];
};


export type ExternalSystemActivistCodesArgs = {
  after?: InputMaybe<Scalars['Cursor']>;
  filter?: InputMaybe<ExternalActivistCodeFilter>;
  first?: InputMaybe<Scalars['Int']>;
};


export type ExternalSystemListsArgs = {
  after?: InputMaybe<Scalars['Cursor']>;
  first?: InputMaybe<Scalars['Int']>;
};


export type ExternalSystemResultCodesArgs = {
  after?: InputMaybe<Scalars['Cursor']>;
  first?: InputMaybe<Scalars['Int']>;
};


export type ExternalSystemSurveyQuestionsArgs = {
  after?: InputMaybe<Scalars['Cursor']>;
  filter?: InputMaybe<ExternalSurveyQuestionFilter>;
  first?: InputMaybe<Scalars['Int']>;
};

export type ExternalSystemEdge = {
  __typename?: 'ExternalSystemEdge';
  cursor: Scalars['Cursor'];
  node: ExternalSystem;
};

export type ExternalSystemInput = {
  apiKey: Scalars['String'];
  name: Scalars['String'];
  operationMode: VanOperationMode;
  type: ExternalSystemType;
  username: Scalars['String'];
};

export type ExternalSystemPage = {
  __typename?: 'ExternalSystemPage';
  edges: Array<ExternalSystemEdge>;
  pageInfo: RelayPageInfo;
};

export enum ExternalSystemType {
  Van = 'VAN'
}

export type FetchCampaignOverlapInput = {
  includeArchived: Scalars['Boolean'];
  targetCampaignId: Scalars['String'];
};

export type FetchCampaignOverlapResult = {
  __typename?: 'FetchCampaignOverlapResult';
  campaign: Campaign;
  lastActivity: Scalars['Date'];
  overlapCount: Scalars['Int'];
};

export type FoundContact = {
  __typename?: 'FoundContact';
  found?: Maybe<Scalars['Boolean']>;
};

export type InteractionStep = {
  __typename?: 'InteractionStep';
  answerActions?: Maybe<Scalars['String']>;
  answerOption?: Maybe<Scalars['String']>;
  createdAt: Scalars['Date'];
  id: Scalars['ID'];
  isDeleted?: Maybe<Scalars['Boolean']>;
  parentInteractionId?: Maybe<Scalars['String']>;
  question?: Maybe<Question>;
  questionResponse?: Maybe<QuestionResponse>;
  questionText?: Maybe<Scalars['String']>;
  scriptOptions: Array<Maybe<Scalars['String']>>;
};


export type InteractionStepQuestionResponseArgs = {
  campaignContactId?: InputMaybe<Scalars['String']>;
};

export type InteractionStepInput = {
  answerActions?: InputMaybe<Scalars['String']>;
  answerOption?: InputMaybe<Scalars['String']>;
  createdAt?: InputMaybe<Scalars['Date']>;
  id?: InputMaybe<Scalars['String']>;
  interactionSteps?: InputMaybe<Array<InputMaybe<InteractionStepInput>>>;
  isDeleted?: InputMaybe<Scalars['Boolean']>;
  parentInteractionId?: InputMaybe<Scalars['String']>;
  questionText?: InputMaybe<Scalars['String']>;
  scriptOptions: Array<InputMaybe<Scalars['String']>>;
};

export type Invite = {
  __typename?: 'Invite';
  hash?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['ID']>;
  isValid?: Maybe<Scalars['Boolean']>;
};

export type InviteInput = {
  created_at?: InputMaybe<Scalars['Date']>;
  hash?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['String']>;
  is_valid?: InputMaybe<Scalars['Boolean']>;
};

export type JobRequest = {
  __typename?: 'JobRequest';
  assigned?: Maybe<Scalars['Boolean']>;
  createdAt: Scalars['Date'];
  id: Scalars['String'];
  jobType: Scalars['String'];
  resultMessage?: Maybe<Scalars['String']>;
  status?: Maybe<Scalars['Int']>;
  updatedAt: Scalars['Date'];
};

export type LinkDomain = {
  __typename?: 'LinkDomain';
  createdAt: Scalars['Date'];
  currentUsageCount: Scalars['Int'];
  cycledOutAt: Scalars['Date'];
  domain: Scalars['String'];
  id: Scalars['ID'];
  isHealthy: Scalars['Boolean'];
  isManuallyDisabled: Scalars['Boolean'];
  maxUsageCount: Scalars['Int'];
};

export type Location = {
  __typename?: 'Location';
  city?: Maybe<Scalars['String']>;
  state?: Maybe<Scalars['String']>;
};

export type MembershipFilter = {
  campaignArchived?: InputMaybe<Scalars['Boolean']>;
  campaignId?: InputMaybe<Scalars['Int']>;
  nameSearch?: InputMaybe<Scalars['String']>;
};

export type Message = {
  __typename?: 'Message';
  assignment?: Maybe<Assignment>;
  campaignId?: Maybe<Scalars['String']>;
  contactNumber?: Maybe<Scalars['String']>;
  createdAt?: Maybe<Scalars['Date']>;
  id?: Maybe<Scalars['ID']>;
  isFromContact?: Maybe<Scalars['Boolean']>;
  sendStatus?: Maybe<Scalars['String']>;
  text?: Maybe<Scalars['String']>;
  userId?: Maybe<Scalars['ID']>;
  userNumber?: Maybe<Scalars['String']>;
};

export type MessageInput = {
  assignmentId?: InputMaybe<Scalars['String']>;
  contactNumber?: InputMaybe<Scalars['Phone']>;
  text?: InputMaybe<Scalars['String']>;
  userId?: InputMaybe<Scalars['String']>;
  versionHash?: InputMaybe<Scalars['String']>;
};

export type MessagingService = {
  __typename?: 'MessagingService';
  id: Scalars['ID'];
  messagingServiceSid: Scalars['String'];
  serviceType: MessagingServiceType;
  tcrBrandRegistrationLink?: Maybe<Scalars['String']>;
  updatedAt: Scalars['String'];
};

export type MessagingServiceEdge = {
  __typename?: 'MessagingServiceEdge';
  cursor: Scalars['Cursor'];
  node: MessagingService;
};

export type MessagingServicePage = {
  __typename?: 'MessagingServicePage';
  edges: Array<MessagingServiceEdge>;
  pageInfo: RelayPageInfo;
};

export enum MessagingServiceType {
  AssembleNumbers = 'ASSEMBLE_NUMBERS',
  Twilio = 'TWILIO'
}

export type Notice = Register10DlcBrandNotice;

export type NoticeEdge = {
  __typename?: 'NoticeEdge';
  cursor: Scalars['Cursor'];
  node: Notice;
};

export type NoticePage = {
  __typename?: 'NoticePage';
  edges: Array<NoticeEdge>;
  pageInfo: RelayPageInfo;
};

export type OffsetLimitCursor = {
  limit: Scalars['Int'];
  offset: Scalars['Int'];
};

export type OptOut = {
  __typename?: 'OptOut';
  assignment?: Maybe<Assignment>;
  cell?: Maybe<Scalars['String']>;
  createdAt?: Maybe<Scalars['Date']>;
  id?: Maybe<Scalars['ID']>;
};

export type Organization = {
  __typename?: 'Organization';
  campaignGroups: CampaignGroupPage;
  campaigns?: Maybe<PaginatedCampaigns>;
  campaignsRelay: CampaignPage;
  currentAssignmentTargets: Array<Maybe<AssignmentTarget>>;
  escalatedConversationCount: Scalars['Int'];
  escalationTagList?: Maybe<Array<Maybe<Tag>>>;
  externalSystems: ExternalSystemPage;
  id?: Maybe<Scalars['ID']>;
  linkDomains: Array<Maybe<LinkDomain>>;
  memberships?: Maybe<OrganizationMembershipPage>;
  messagingServices: MessagingServicePage;
  myCurrentAssignmentTarget?: Maybe<AssignmentTarget>;
  myCurrentAssignmentTargets: Array<Maybe<AssignmentTarget>>;
  name?: Maybe<Scalars['String']>;
  numbersApiKey?: Maybe<Scalars['String']>;
  optOutMessage?: Maybe<Scalars['String']>;
  optOuts?: Maybe<Array<Maybe<OptOut>>>;
  pendingAssignmentRequestCount: Scalars['Int'];
  people?: Maybe<Array<Maybe<User>>>;
  peopleCount?: Maybe<Scalars['Int']>;
  settings: OrganizationSettings;
  tagList?: Maybe<Array<Maybe<Tag>>>;
  teams: Array<Maybe<Team>>;
  textRequestFormEnabled?: Maybe<Scalars['Boolean']>;
  textRequestMaxCount?: Maybe<Scalars['Int']>;
  textRequestType?: Maybe<TextRequestType>;
  textingHoursEnd?: Maybe<Scalars['Int']>;
  textingHoursEnforced?: Maybe<Scalars['Boolean']>;
  textingHoursStart?: Maybe<Scalars['Int']>;
  textsAvailable?: Maybe<Scalars['Boolean']>;
  threeClickEnabled?: Maybe<Scalars['Boolean']>;
  unhealthyLinkDomains: Array<Maybe<UnhealthyLinkDomain>>;
  uuid?: Maybe<Scalars['String']>;
};


export type OrganizationCampaignGroupsArgs = {
  after?: InputMaybe<Scalars['Cursor']>;
  first?: InputMaybe<Scalars['Int']>;
};


export type OrganizationCampaignsArgs = {
  campaignsFilter?: InputMaybe<CampaignsFilter>;
  cursor?: InputMaybe<OffsetLimitCursor>;
};


export type OrganizationCampaignsRelayArgs = {
  after?: InputMaybe<Scalars['Cursor']>;
  filter?: InputMaybe<CampaignsFilter>;
  first?: InputMaybe<Scalars['Int']>;
};


export type OrganizationExternalSystemsArgs = {
  after?: InputMaybe<Scalars['Cursor']>;
  first?: InputMaybe<Scalars['Int']>;
};


export type OrganizationMembershipsArgs = {
  after?: InputMaybe<Scalars['Cursor']>;
  filter?: InputMaybe<MembershipFilter>;
  first?: InputMaybe<Scalars['Int']>;
};


export type OrganizationMessagingServicesArgs = {
  after?: InputMaybe<Scalars['Cursor']>;
  first?: InputMaybe<Scalars['Int']>;
};


export type OrganizationPeopleArgs = {
  campaignId?: InputMaybe<Scalars['String']>;
  offset?: InputMaybe<Scalars['Int']>;
  role?: InputMaybe<Scalars['String']>;
};

export type OrganizationMembership = {
  __typename?: 'OrganizationMembership';
  id: Scalars['ID'];
  organization: Organization;
  requestAutoApprove: RequestAutoApprove;
  role: UserRole;
  user: User;
};

export type OrganizationMembershipEdge = {
  __typename?: 'OrganizationMembershipEdge';
  cursor: Scalars['Cursor'];
  node: OrganizationMembership;
};

export type OrganizationMembershipPage = {
  __typename?: 'OrganizationMembershipPage';
  edges: Array<OrganizationMembershipEdge>;
  pageInfo: RelayPageInfo;
};

export type OrganizationSettings = {
  __typename?: 'OrganizationSettings';
  confirmationClickForScriptLinks: Scalars['Boolean'];
  defaulTexterApprovalStatus: RequestAutoApprove;
  id: Scalars['ID'];
  numbersApiKey?: Maybe<Scalars['String']>;
  optOutMessage?: Maybe<Scalars['String']>;
  showContactCell?: Maybe<Scalars['Boolean']>;
  showContactLastName?: Maybe<Scalars['Boolean']>;
  trollbotWebhookUrl?: Maybe<Scalars['String']>;
};

export type OrganizationSettingsInput = {
  confirmationClickForScriptLinks?: InputMaybe<Scalars['Boolean']>;
  defaulTexterApprovalStatus?: InputMaybe<RequestAutoApprove>;
  numbersApiKey?: InputMaybe<Scalars['String']>;
  optOutMessage?: InputMaybe<Scalars['String']>;
  showContactCell?: InputMaybe<Scalars['Boolean']>;
  showContactLastName?: InputMaybe<Scalars['Boolean']>;
  trollbotWebhookUrl?: InputMaybe<Scalars['String']>;
};

export type PageInfo = {
  __typename?: 'PageInfo';
  limit: Scalars['Int'];
  next?: Maybe<Scalars['Int']>;
  offset: Scalars['Int'];
  previous?: Maybe<Scalars['Int']>;
  total: Scalars['Int'];
};

export type PaginatedCampaigns = {
  __typename?: 'PaginatedCampaigns';
  campaigns?: Maybe<Array<Maybe<Campaign>>>;
  pageInfo?: Maybe<PageInfo>;
};

export type PaginatedConversations = {
  __typename?: 'PaginatedConversations';
  conversations: Array<Maybe<Conversation>>;
  pageInfo?: Maybe<PageInfo>;
};

export type PaginatedUsers = {
  __typename?: 'PaginatedUsers';
  pageInfo?: Maybe<PageInfo>;
  users?: Maybe<Array<Maybe<User>>>;
};

export type Question = {
  __typename?: 'Question';
  answerOptions?: Maybe<Array<Maybe<AnswerOption>>>;
  interactionStep?: Maybe<InteractionStep>;
  text?: Maybe<Scalars['String']>;
};

export type QuestionResponse = {
  __typename?: 'QuestionResponse';
  id?: Maybe<Scalars['String']>;
  question?: Maybe<Question>;
  value?: Maybe<Scalars['String']>;
};

export type QuestionResponseInput = {
  campaignContactId: Scalars['String'];
  interactionStepId: Scalars['String'];
  value: Scalars['String'];
};

export type QuestionResponseSyncConfigInput = {
  id: Scalars['String'];
};

export type QuestionResponseSyncTargetInput = {
  activistCodeId?: InputMaybe<Scalars['String']>;
  configId: Scalars['String'];
  responseOptionId?: InputMaybe<Scalars['String']>;
  resultCodeId?: InputMaybe<Scalars['String']>;
};

export type Register10DlcBrandNotice = {
  __typename?: 'Register10DlcBrandNotice';
  id: Scalars['ID'];
  tcrBrandRegistrationUrl?: Maybe<Scalars['String']>;
};

export type RelayPageInfo = {
  __typename?: 'RelayPageInfo';
  endCursor?: Maybe<Scalars['Cursor']>;
  hasNextPage: Scalars['Boolean'];
  hasPreviousPage: Scalars['Boolean'];
  startCursor?: Maybe<Scalars['Cursor']>;
  totalCount: Scalars['Int'];
};

export enum ReleaseActionTarget {
  Unreplied = 'UNREPLIED',
  Unsent = 'UNSENT'
}

export type ReleaseAllUnhandledRepliesResult = {
  __typename?: 'ReleaseAllUnhandledRepliesResult';
  campaignCount?: Maybe<Scalars['Int']>;
  contactCount?: Maybe<Scalars['Int']>;
};

export enum RequestAutoApprove {
  ApprovalRequired = 'APPROVAL_REQUIRED',
  AutoApprove = 'AUTO_APPROVE',
  DoNotApprove = 'DO_NOT_APPROVE'
}

export type ReturnString = {
  __typename?: 'ReturnString';
  data: Scalars['String'];
};

export type RootMutation = {
  __typename?: 'RootMutation';
  addToken: Scalars['Boolean'];
  addUsersToTeam: Scalars['Boolean'];
  archiveCampaign?: Maybe<Campaign>;
  assignUserToCampaign?: Maybe<Campaign>;
  bulkSendMessages?: Maybe<Array<Maybe<CampaignContact>>>;
  bulkUpdateScript?: Maybe<Array<Maybe<ScriptUpdateResult>>>;
  changeUserPassword?: Maybe<User>;
  copyCampaign?: Maybe<Campaign>;
  createCampaign?: Maybe<Campaign>;
  createCannedResponse?: Maybe<CannedResponse>;
  createExternalSystem: ExternalSystem;
  createInvite?: Maybe<Invite>;
  createOptOut?: Maybe<CampaignContact>;
  createOrganization?: Maybe<Organization>;
  createQuestionResponseSyncConfig: ExternalSyncQuestionResponseConfig;
  createQuestionResponseSyncTarget: ExternalSyncConfigTarget;
  deleteCampaignGroup: Scalars['Boolean'];
  deleteCampaignOverlap: DeleteCampaignOverlapResult;
  deleteJob?: Maybe<JobRequest>;
  deleteLinkDomain: Scalars['Boolean'];
  deleteManyCampaignOverlap: Scalars['Int'];
  deleteNeedsMessage: Scalars['String'];
  deleteQuestionResponseSyncConfig: ExternalSyncQuestionResponseConfig;
  deleteQuestionResponseSyncTarget: Scalars['String'];
  deleteQuestionResponses?: Maybe<CampaignContact>;
  deleteTag: Scalars['Boolean'];
  deleteTeam: Scalars['Boolean'];
  dismissAlarms: Scalars['Boolean'];
  dismissMatchingAlarms: Scalars['Boolean'];
  editCampaign?: Maybe<Campaign>;
  editCampaignContactMessageStatus?: Maybe<CampaignContact>;
  editExternalOptOutSyncConfig: ExternalSystem;
  editExternalSystem: ExternalSystem;
  editOrganization: Organization;
  editOrganizationMembership: OrganizationMembership;
  editOrganizationSettings: OrganizationSettings;
  editUser?: Maybe<User>;
  exportCampaign?: Maybe<JobRequest>;
  filterLandlines?: Maybe<Campaign>;
  findNewCampaignContact?: Maybe<FoundContact>;
  getAssignmentContacts?: Maybe<Array<Maybe<CampaignContact>>>;
  handleConversation?: Maybe<CampaignContact>;
  insertLinkDomain: LinkDomain;
  joinOrganization: Organization;
  markForSecondPass: Scalars['String'];
  megaBulkReassignCampaignContacts: Scalars['Boolean'];
  megaReassignCampaignContacts: Scalars['Boolean'];
  purgeOrganizationUsers: Scalars['Int'];
  refreshExternalSystem: Scalars['Boolean'];
  releaseAllUnhandledReplies: ReleaseAllUnhandledRepliesResult;
  releaseMessages: Scalars['String'];
  releaseMyReplies: Scalars['Boolean'];
  removeOptOut?: Maybe<Array<Maybe<CampaignContact>>>;
  removeToken: Scalars['Boolean'];
  removeUsersFromTeam: Scalars['Boolean'];
  requestTexts: Scalars['String'];
  resetUserPassword: Scalars['String'];
  resolveAssignmentRequest: Scalars['Int'];
  saveCampaignGroups: Array<CampaignGroup>;
  saveTag: Tag;
  saveTeams: Array<Maybe<Team>>;
  sendMessage?: Maybe<CampaignContact>;
  sendReply?: Maybe<CampaignContact>;
  startCampaign?: Maybe<Campaign>;
  syncCampaignToSystem: Scalars['Boolean'];
  tagConversation?: Maybe<CampaignContact>;
  unMarkForSecondPass: Scalars['String'];
  unarchiveCampaign?: Maybe<Campaign>;
  updateLinkDomain: LinkDomain;
  updateQuestionResponses?: Maybe<CampaignContact>;
  updateTextRequestFormSettings?: Maybe<Organization>;
  updateTextingHours?: Maybe<Organization>;
  updateTextingHoursEnforcement?: Maybe<Organization>;
  userAgreeTerms?: Maybe<User>;
};


export type RootMutationAddTokenArgs = {
  input: TrollTriggerInput;
  organizationId: Scalars['String'];
};


export type RootMutationAddUsersToTeamArgs = {
  teamId: Scalars['String'];
  userIds: Array<InputMaybe<Scalars['String']>>;
};


export type RootMutationArchiveCampaignArgs = {
  id: Scalars['String'];
};


export type RootMutationAssignUserToCampaignArgs = {
  campaignId: Scalars['String'];
  organizationUuid: Scalars['String'];
};


export type RootMutationBulkSendMessagesArgs = {
  assignmentId: Scalars['Int'];
};


export type RootMutationBulkUpdateScriptArgs = {
  findAndReplace: BulkUpdateScriptInput;
  organizationId: Scalars['String'];
};


export type RootMutationChangeUserPasswordArgs = {
  formData?: InputMaybe<UserPasswordChange>;
  userId: Scalars['Int'];
};


export type RootMutationCopyCampaignArgs = {
  id: Scalars['String'];
};


export type RootMutationCreateCampaignArgs = {
  campaign: CampaignInput;
};


export type RootMutationCreateCannedResponseArgs = {
  cannedResponse: CannedResponseInput;
};


export type RootMutationCreateExternalSystemArgs = {
  externalSystem: ExternalSystemInput;
  organizationId: Scalars['String'];
};


export type RootMutationCreateInviteArgs = {
  invite: InviteInput;
};


export type RootMutationCreateOptOutArgs = {
  campaignContactId: Scalars['String'];
  optOut: ContactActionInput;
};


export type RootMutationCreateOrganizationArgs = {
  inviteId: Scalars['String'];
  name: Scalars['String'];
  userId: Scalars['String'];
};


export type RootMutationCreateQuestionResponseSyncConfigArgs = {
  input: QuestionResponseSyncConfigInput;
};


export type RootMutationCreateQuestionResponseSyncTargetArgs = {
  input: QuestionResponseSyncTargetInput;
};


export type RootMutationDeleteCampaignGroupArgs = {
  campaignGroupId: Scalars['String'];
  organizationId: Scalars['String'];
};


export type RootMutationDeleteCampaignOverlapArgs = {
  campaignId: Scalars['String'];
  organizationId: Scalars['String'];
  overlappingCampaignId: Scalars['String'];
};


export type RootMutationDeleteJobArgs = {
  campaignId: Scalars['String'];
  id: Scalars['String'];
};


export type RootMutationDeleteLinkDomainArgs = {
  domainId: Scalars['String'];
  organizationId: Scalars['String'];
};


export type RootMutationDeleteManyCampaignOverlapArgs = {
  campaignId: Scalars['String'];
  organizationId: Scalars['String'];
  overlappingCampaignIds: Array<InputMaybe<Scalars['String']>>;
};


export type RootMutationDeleteNeedsMessageArgs = {
  campaignId: Scalars['String'];
};


export type RootMutationDeleteQuestionResponseSyncConfigArgs = {
  input: QuestionResponseSyncConfigInput;
};


export type RootMutationDeleteQuestionResponseSyncTargetArgs = {
  targetId: Scalars['String'];
};


export type RootMutationDeleteQuestionResponsesArgs = {
  campaignContactId: Scalars['String'];
  interactionStepIds?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
};


export type RootMutationDeleteTagArgs = {
  organizationId: Scalars['String'];
  tagId: Scalars['String'];
};


export type RootMutationDeleteTeamArgs = {
  organizationId: Scalars['String'];
  teamId: Scalars['String'];
};


export type RootMutationDismissAlarmsArgs = {
  messageIds: Array<Scalars['String']>;
  organizationId: Scalars['String'];
};


export type RootMutationDismissMatchingAlarmsArgs = {
  organizationId: Scalars['String'];
  token: Scalars['String'];
};


export type RootMutationEditCampaignArgs = {
  campaign: CampaignInput;
  id: Scalars['String'];
};


export type RootMutationEditCampaignContactMessageStatusArgs = {
  campaignContactId: Scalars['String'];
  messageStatus: Scalars['String'];
};


export type RootMutationEditExternalOptOutSyncConfigArgs = {
  systemId: Scalars['String'];
  targetId?: InputMaybe<Scalars['String']>;
};


export type RootMutationEditExternalSystemArgs = {
  externalSystem: ExternalSystemInput;
  id: Scalars['String'];
};


export type RootMutationEditOrganizationArgs = {
  id: Scalars['String'];
  input: EditOrganizationInput;
};


export type RootMutationEditOrganizationMembershipArgs = {
  id: Scalars['String'];
  level?: InputMaybe<RequestAutoApprove>;
  role?: InputMaybe<Scalars['String']>;
};


export type RootMutationEditOrganizationSettingsArgs = {
  id: Scalars['String'];
  input: OrganizationSettingsInput;
};


export type RootMutationEditUserArgs = {
  organizationId: Scalars['String'];
  userData?: InputMaybe<UserInput>;
  userId: Scalars['Int'];
};


export type RootMutationExportCampaignArgs = {
  options: CampaignExportInput;
};


export type RootMutationFilterLandlinesArgs = {
  id: Scalars['String'];
};


export type RootMutationFindNewCampaignContactArgs = {
  assignmentId: Scalars['String'];
  numberContacts: Scalars['Int'];
};


export type RootMutationGetAssignmentContactsArgs = {
  assignmentId: Scalars['String'];
  contactIds?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  findNew?: InputMaybe<Scalars['Boolean']>;
};


export type RootMutationHandleConversationArgs = {
  campaignContactId: Scalars['String'];
  closeConversation?: InputMaybe<Scalars['Boolean']>;
  interactionStepIdsForDeletedQuestionResponses?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  message?: InputMaybe<MessageInput>;
  optOut?: InputMaybe<ContactActionInput>;
  questionResponses?: InputMaybe<Array<InputMaybe<QuestionResponseInput>>>;
};


export type RootMutationInsertLinkDomainArgs = {
  domain: Scalars['String'];
  maxUsageCount: Scalars['Int'];
  organizationId: Scalars['String'];
};


export type RootMutationJoinOrganizationArgs = {
  organizationUuid: Scalars['String'];
};


export type RootMutationMarkForSecondPassArgs = {
  campaignId: Scalars['String'];
  input: SecondPassInput;
};


export type RootMutationMegaBulkReassignCampaignContactsArgs = {
  assignmentsFilter?: InputMaybe<AssignmentsFilter>;
  campaignsFilter?: InputMaybe<CampaignsFilter>;
  contactNameFilter?: InputMaybe<ContactNameFilter>;
  contactsFilter?: InputMaybe<ContactsFilter>;
  newTexterUserIds?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  organizationId: Scalars['String'];
  tagsFilter?: InputMaybe<TagsFilter>;
};


export type RootMutationMegaReassignCampaignContactsArgs = {
  campaignIdsContactIds: Array<InputMaybe<CampaignIdContactId>>;
  newTexterUserIds?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
  organizationId: Scalars['String'];
};


export type RootMutationPurgeOrganizationUsersArgs = {
  organizationId: Scalars['String'];
};


export type RootMutationRefreshExternalSystemArgs = {
  externalSystemId: Scalars['String'];
};


export type RootMutationReleaseAllUnhandledRepliesArgs = {
  ageInHours?: InputMaybe<Scalars['Float']>;
  limitToCurrentlyTextableContacts?: InputMaybe<Scalars['Boolean']>;
  organizationId: Scalars['String'];
  releaseOnRestricted?: InputMaybe<Scalars['Boolean']>;
};


export type RootMutationReleaseMessagesArgs = {
  ageInHours?: InputMaybe<Scalars['Float']>;
  campaignId: Scalars['String'];
  target: ReleaseActionTarget;
};


export type RootMutationReleaseMyRepliesArgs = {
  organizationId: Scalars['String'];
};


export type RootMutationRemoveOptOutArgs = {
  cell: Scalars['Phone'];
};


export type RootMutationRemoveTokenArgs = {
  organizationId: Scalars['String'];
  token: Scalars['String'];
};


export type RootMutationRemoveUsersFromTeamArgs = {
  teamId: Scalars['String'];
  userIds: Array<InputMaybe<Scalars['String']>>;
};


export type RootMutationRequestTextsArgs = {
  count: Scalars['Int'];
  email: Scalars['String'];
  organizationId: Scalars['String'];
  preferredTeamId: Scalars['Int'];
};


export type RootMutationResetUserPasswordArgs = {
  organizationId: Scalars['String'];
  userId: Scalars['Int'];
};


export type RootMutationResolveAssignmentRequestArgs = {
  approved: Scalars['Boolean'];
  assignmentRequestId: Scalars['String'];
  autoApproveLevel?: InputMaybe<RequestAutoApprove>;
};


export type RootMutationSaveCampaignGroupsArgs = {
  campaignGroups: Array<CampaignGroupInput>;
  organizationId: Scalars['String'];
};


export type RootMutationSaveTagArgs = {
  organizationId: Scalars['String'];
  tag: TagInput;
};


export type RootMutationSaveTeamsArgs = {
  organizationId: Scalars['String'];
  teams: Array<InputMaybe<TeamInput>>;
};


export type RootMutationSendMessageArgs = {
  campaignContactId: Scalars['String'];
  message: MessageInput;
};


export type RootMutationSendReplyArgs = {
  id: Scalars['String'];
  message: Scalars['String'];
};


export type RootMutationStartCampaignArgs = {
  id: Scalars['String'];
};


export type RootMutationSyncCampaignToSystemArgs = {
  input: SyncCampaignToSystemInput;
};


export type RootMutationTagConversationArgs = {
  campaignContactId: Scalars['String'];
  tag: ContactTagActionInput;
};


export type RootMutationUnMarkForSecondPassArgs = {
  campaignId: Scalars['String'];
};


export type RootMutationUnarchiveCampaignArgs = {
  id: Scalars['String'];
};


export type RootMutationUpdateLinkDomainArgs = {
  domainId: Scalars['String'];
  organizationId: Scalars['String'];
  payload: UpdateLinkDomain;
};


export type RootMutationUpdateQuestionResponsesArgs = {
  campaignContactId: Scalars['String'];
  questionResponses?: InputMaybe<Array<InputMaybe<QuestionResponseInput>>>;
};


export type RootMutationUpdateTextRequestFormSettingsArgs = {
  organizationId: Scalars['String'];
  textRequestFormEnabled: Scalars['Boolean'];
  textRequestMaxCount: Scalars['Int'];
  textRequestType: Scalars['String'];
};


export type RootMutationUpdateTextingHoursArgs = {
  organizationId: Scalars['String'];
  textingHoursEnd: Scalars['Int'];
  textingHoursStart: Scalars['Int'];
};


export type RootMutationUpdateTextingHoursEnforcementArgs = {
  organizationId: Scalars['String'];
  textingHoursEnforced: Scalars['Boolean'];
};


export type RootMutationUserAgreeTermsArgs = {
  userId: Scalars['String'];
};

export type RootQuery = {
  __typename?: 'RootQuery';
  assignment?: Maybe<Assignment>;
  assignmentRequests?: Maybe<Array<Maybe<AssignmentRequest>>>;
  availableActions?: Maybe<Array<Maybe<Action>>>;
  campaign?: Maybe<Campaign>;
  campaignGroups: CampaignGroupPage;
  campaigns?: Maybe<CampaignsReturn>;
  contact?: Maybe<CampaignContact>;
  conversations?: Maybe<PaginatedConversations>;
  currentUser?: Maybe<User>;
  externalLists: ExternalListPage;
  externalSystem: ExternalSystem;
  externalSystems: ExternalSystemPage;
  fetchCampaignOverlaps: Array<Maybe<FetchCampaignOverlapResult>>;
  inviteByHash?: Maybe<Array<Maybe<Invite>>>;
  notices: NoticePage;
  organization?: Maybe<Organization>;
  organizations?: Maybe<Array<Maybe<Organization>>>;
  people?: Maybe<UsersReturn>;
  peopleByUserIds?: Maybe<UsersList>;
  team: Team;
  trollAlarms: TrollAlarmPage;
  trollAlarmsCount: TrollAlarmCount;
  trollTokens?: Maybe<Array<Maybe<TrollTrigger>>>;
};


export type RootQueryAssignmentArgs = {
  id: Scalars['String'];
};


export type RootQueryAssignmentRequestsArgs = {
  organizationId: Scalars['String'];
  status?: InputMaybe<Scalars['String']>;
};


export type RootQueryAvailableActionsArgs = {
  organizationId: Scalars['String'];
};


export type RootQueryCampaignArgs = {
  id: Scalars['String'];
};


export type RootQueryCampaignGroupsArgs = {
  after?: InputMaybe<Scalars['Cursor']>;
  first?: InputMaybe<Scalars['Int']>;
  organizationId: Scalars['String'];
};


export type RootQueryCampaignsArgs = {
  campaignsFilter?: InputMaybe<CampaignsFilter>;
  cursor?: InputMaybe<OffsetLimitCursor>;
  organizationId: Scalars['String'];
};


export type RootQueryContactArgs = {
  id: Scalars['String'];
};


export type RootQueryConversationsArgs = {
  assignmentsFilter?: InputMaybe<AssignmentsFilter>;
  campaignsFilter?: InputMaybe<CampaignsFilter>;
  contactNameFilter?: InputMaybe<ContactNameFilter>;
  contactsFilter?: InputMaybe<ContactsFilter>;
  cursor: OffsetLimitCursor;
  organizationId: Scalars['String'];
  tagsFilter?: InputMaybe<TagsFilter>;
};


export type RootQueryExternalListsArgs = {
  after?: InputMaybe<Scalars['Cursor']>;
  first?: InputMaybe<Scalars['Int']>;
  organizationId: Scalars['String'];
  systemId: Scalars['String'];
};


export type RootQueryExternalSystemArgs = {
  systemId: Scalars['String'];
};


export type RootQueryExternalSystemsArgs = {
  after?: InputMaybe<Scalars['Cursor']>;
  first?: InputMaybe<Scalars['Int']>;
  organizationId: Scalars['String'];
};


export type RootQueryFetchCampaignOverlapsArgs = {
  input: FetchCampaignOverlapInput;
};


export type RootQueryInviteByHashArgs = {
  hash: Scalars['String'];
};


export type RootQueryNoticesArgs = {
  organizationId?: InputMaybe<Scalars['String']>;
};


export type RootQueryOrganizationArgs = {
  id: Scalars['String'];
  utc?: InputMaybe<Scalars['String']>;
};


export type RootQueryPeopleArgs = {
  campaignsFilter?: InputMaybe<CampaignsFilter>;
  cursor?: InputMaybe<OffsetLimitCursor>;
  organizationId: Scalars['String'];
  role?: InputMaybe<Scalars['String']>;
  userIds?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
};


export type RootQueryPeopleByUserIdsArgs = {
  organizationId: Scalars['String'];
  userIds?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
};


export type RootQueryTeamArgs = {
  id: Scalars['String'];
};


export type RootQueryTrollAlarmsArgs = {
  dismissed: Scalars['Boolean'];
  limit: Scalars['Int'];
  offset: Scalars['Int'];
  organizationId: Scalars['String'];
  token?: InputMaybe<Scalars['String']>;
};


export type RootQueryTrollAlarmsCountArgs = {
  dismissed: Scalars['Boolean'];
  organizationId: Scalars['String'];
};


export type RootQueryTrollTokensArgs = {
  organizationId: Scalars['String'];
};

export type ScriptUpdateResult = {
  __typename?: 'ScriptUpdateResult';
  campaignId: Scalars['String'];
  found: Scalars['String'];
  replaced: Scalars['String'];
};

export type SecondPassInput = {
  excludeAgeInHours?: InputMaybe<Scalars['Float']>;
  excludeNewer: Scalars['Boolean'];
};

export type SyncCampaignToSystemInput = {
  campaignId: Scalars['String'];
};

export type Tag = {
  __typename?: 'Tag';
  author?: Maybe<User>;
  backgroundColor: Scalars['String'];
  confirmationSteps: Array<Maybe<Array<Maybe<Scalars['String']>>>>;
  contacts: Array<Maybe<CampaignContact>>;
  createdAt: Scalars['Date'];
  description: Scalars['String'];
  externalSyncConfigurations: ExternalSyncTagConfigPage;
  id: Scalars['ID'];
  isAssignable: Scalars['Boolean'];
  isSystem: Scalars['Boolean'];
  onApplyScript: Scalars['String'];
  textColor: Scalars['String'];
  title: Scalars['String'];
  webhookUrl: Scalars['String'];
};


export type TagContactsArgs = {
  campaignId?: InputMaybe<Scalars['String']>;
};


export type TagExternalSyncConfigurationsArgs = {
  after?: InputMaybe<Scalars['Cursor']>;
  first?: InputMaybe<Scalars['Int']>;
};

export type TagInput = {
  backgroundColor?: InputMaybe<Scalars['String']>;
  confirmationSteps?: InputMaybe<Array<InputMaybe<Array<InputMaybe<Scalars['String']>>>>>;
  description: Scalars['String'];
  id?: InputMaybe<Scalars['ID']>;
  isAssignable: Scalars['Boolean'];
  onApplyScript?: InputMaybe<Scalars['String']>;
  textColor?: InputMaybe<Scalars['String']>;
  title: Scalars['String'];
  webhookUrl?: InputMaybe<Scalars['String']>;
};

export type TagsFilter = {
  escalatedConvosOnly?: InputMaybe<Scalars['Boolean']>;
  excludeEscalated?: InputMaybe<Scalars['Boolean']>;
  specificTagIds?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
};

export type Team = {
  __typename?: 'Team';
  assignmentPriority: Scalars['Int'];
  assignmentType?: Maybe<TextRequestType>;
  author?: Maybe<User>;
  backgroundColor: Scalars['String'];
  campaigns: Array<Maybe<Campaign>>;
  createdAt: Scalars['Date'];
  description: Scalars['String'];
  escalationTags?: Maybe<Array<Maybe<Tag>>>;
  id: Scalars['ID'];
  isAssignmentEnabled: Scalars['Boolean'];
  maxRequestCount?: Maybe<Scalars['Int']>;
  textColor: Scalars['String'];
  title: Scalars['String'];
  users: Array<Maybe<User>>;
};

export type TeamInput = {
  assignmentPriority?: InputMaybe<Scalars['Int']>;
  assignmentType?: InputMaybe<TextRequestType>;
  backgroundColor?: InputMaybe<Scalars['String']>;
  description?: InputMaybe<Scalars['String']>;
  escalationTagIds?: InputMaybe<Array<InputMaybe<Scalars['Int']>>>;
  id?: InputMaybe<Scalars['ID']>;
  isAssignmentEnabled?: InputMaybe<Scalars['Boolean']>;
  maxRequestCount?: InputMaybe<Scalars['Int']>;
  textColor?: InputMaybe<Scalars['String']>;
  title?: InputMaybe<Scalars['String']>;
};

export enum TextRequestType {
  Unreplied = 'UNREPLIED',
  Unsent = 'UNSENT'
}

export type TexterAssignmentInput = {
  contactsCount: Scalars['Int'];
  userId: Scalars['String'];
};

export type TexterInput = {
  assignmentInputs: Array<TexterAssignmentInput>;
  ignoreAfterDate: Scalars['Date'];
};

export type TrollAlarm = {
  __typename?: 'TrollAlarm';
  contact: CampaignContact;
  dismissed: Scalars['Boolean'];
  id: Scalars['ID'];
  messageId: Scalars['ID'];
  messageText: Scalars['String'];
  token: Scalars['String'];
  user: User;
};

export type TrollAlarmCount = {
  __typename?: 'TrollAlarmCount';
  totalCount: Scalars['Int'];
};

export type TrollAlarmPage = {
  __typename?: 'TrollAlarmPage';
  alarms: Array<TrollAlarm>;
  totalCount: Scalars['Int'];
};

export type TrollTrigger = {
  __typename?: 'TrollTrigger';
  compiledTsQuery: Scalars['String'];
  id: Scalars['ID'];
  mode: TrollTriggerMode;
  organizationId: Scalars['String'];
  token: Scalars['String'];
};

export type TrollTriggerInput = {
  mode: TrollTriggerMode;
  token: Scalars['String'];
};

export enum TrollTriggerMode {
  English = 'ENGLISH',
  Simple = 'SIMPLE',
  Spanish = 'SPANISH'
}

export type UnhealthyLinkDomain = {
  __typename?: 'UnhealthyLinkDomain';
  createdAt: Scalars['Date'];
  domain: Scalars['String'];
  healthyAgainAt?: Maybe<Scalars['Date']>;
  id: Scalars['ID'];
};

export type UpdateLinkDomain = {
  isManuallyDisabled?: InputMaybe<Scalars['Boolean']>;
  maxUsageCount?: InputMaybe<Scalars['Int']>;
};

export type User = {
  __typename?: 'User';
  assignedCell?: Maybe<Scalars['Phone']>;
  assignment?: Maybe<Assignment>;
  cell?: Maybe<Scalars['String']>;
  currentRequest?: Maybe<AssignmentRequest>;
  displayName?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  firstName?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['ID']>;
  isSuperadmin: Scalars['Boolean'];
  lastName?: Maybe<Scalars['String']>;
  memberships?: Maybe<OrganizationMembershipPage>;
  organizations?: Maybe<Array<Maybe<Organization>>>;
  roles: Array<Scalars['String']>;
  teams: Array<Maybe<Team>>;
  terms?: Maybe<Scalars['Boolean']>;
  todos?: Maybe<Array<Maybe<Assignment>>>;
};


export type UserAssignmentArgs = {
  campaignId?: InputMaybe<Scalars['String']>;
};


export type UserCurrentRequestArgs = {
  organizationId: Scalars['String'];
};


export type UserMembershipsArgs = {
  after?: InputMaybe<Scalars['Cursor']>;
  first?: InputMaybe<Scalars['Int']>;
  organizationId?: InputMaybe<Scalars['String']>;
};


export type UserOrganizationsArgs = {
  role?: InputMaybe<Scalars['String']>;
};


export type UserRolesArgs = {
  organizationId: Scalars['String'];
};


export type UserTeamsArgs = {
  organizationId: Scalars['String'];
};


export type UserTodosArgs = {
  organizationId?: InputMaybe<Scalars['String']>;
};

export type UserInput = {
  cell: Scalars['String'];
  email: Scalars['String'];
  firstName: Scalars['String'];
  id?: InputMaybe<Scalars['String']>;
  lastName: Scalars['String'];
  newPassword?: InputMaybe<Scalars['String']>;
  oldPassword?: InputMaybe<Scalars['String']>;
};

export type UserPasswordChange = {
  newPassword: Scalars['String'];
  password: Scalars['String'];
  passwordConfirm: Scalars['String'];
};

export enum UserRole {
  Admin = 'ADMIN',
  Owner = 'OWNER',
  Superadmin = 'SUPERADMIN',
  Supervolunteer = 'SUPERVOLUNTEER',
  Texter = 'TEXTER'
}

export type UsersList = {
  __typename?: 'UsersList';
  users?: Maybe<Array<Maybe<User>>>;
};

export type UsersReturn = PaginatedUsers | UsersList;

export enum VanOperationMode {
  Mycampaign = 'MYCAMPAIGN',
  Voterfile = 'VOTERFILE'
}



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Action: ResolverTypeWrapper<Action>;
  AnswerOption: ResolverTypeWrapper<AnswerOption>;
  AnswerOptionInput: AnswerOptionInput;
  Assignment: ResolverTypeWrapper<Assignment>;
  AssignmentRequest: ResolverTypeWrapper<AssignmentRequest>;
  AssignmentTarget: ResolverTypeWrapper<AssignmentTarget>;
  AssignmentsFilter: AssignmentsFilter;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  BulkUpdateScriptInput: BulkUpdateScriptInput;
  Campaign: ResolverTypeWrapper<Campaign>;
  CampaignContact: ResolverTypeWrapper<CampaignContact>;
  CampaignContactInput: CampaignContactInput;
  CampaignDeliverabilityStats: ResolverTypeWrapper<CampaignDeliverabilityStats>;
  CampaignEdge: ResolverTypeWrapper<CampaignEdge>;
  CampaignExportInput: CampaignExportInput;
  CampaignExportType: CampaignExportType;
  CampaignGroup: ResolverTypeWrapper<CampaignGroup>;
  CampaignGroupEdge: ResolverTypeWrapper<CampaignGroupEdge>;
  CampaignGroupInput: CampaignGroupInput;
  CampaignGroupPage: ResolverTypeWrapper<CampaignGroupPage>;
  CampaignIdContactId: CampaignIdContactId;
  CampaignInput: CampaignInput;
  CampaignPage: ResolverTypeWrapper<CampaignPage>;
  CampaignReadiness: ResolverTypeWrapper<CampaignReadiness>;
  CampaignStats: ResolverTypeWrapper<CampaignStats>;
  CampaignsFilter: CampaignsFilter;
  CampaignsList: ResolverTypeWrapper<CampaignsList>;
  CampaignsReturn: ResolversTypes['CampaignsList'] | ResolversTypes['PaginatedCampaigns'];
  CannedResponse: ResolverTypeWrapper<CannedResponse>;
  CannedResponseInput: CannedResponseInput;
  ContactActionInput: ContactActionInput;
  ContactMessage: ContactMessage;
  ContactNameFilter: ContactNameFilter;
  ContactTagActionInput: ContactTagActionInput;
  ContactsFilter: ContactsFilter;
  Conversation: ResolverTypeWrapper<Conversation>;
  ConversationFilter: ConversationFilter;
  Cursor: ResolverTypeWrapper<Scalars['Cursor']>;
  Date: ResolverTypeWrapper<Scalars['Date']>;
  DeleteCampaignOverlapResult: ResolverTypeWrapper<DeleteCampaignOverlapResult>;
  DeliverabilityErrorStat: ResolverTypeWrapper<DeliverabilityErrorStat>;
  EditOrganizationInput: EditOrganizationInput;
  ExportForVanInput: ExportForVanInput;
  ExternalActivistCode: ResolverTypeWrapper<ExternalActivistCode>;
  ExternalActivistCodeEdge: ResolverTypeWrapper<ExternalActivistCodeEdge>;
  ExternalActivistCodeFilter: ExternalActivistCodeFilter;
  ExternalActivistCodePage: ResolverTypeWrapper<ExternalActivistCodePage>;
  ExternalActivistCodeTarget: ResolverTypeWrapper<ExternalActivistCodeTarget>;
  ExternalDataCollectionStatus: ExternalDataCollectionStatus;
  ExternalList: ResolverTypeWrapper<ExternalList>;
  ExternalListEdge: ResolverTypeWrapper<ExternalListEdge>;
  ExternalListPage: ResolverTypeWrapper<ExternalListPage>;
  ExternalResultCode: ResolverTypeWrapper<ExternalResultCode>;
  ExternalResultCodeEdge: ResolverTypeWrapper<ExternalResultCodeEdge>;
  ExternalResultCodePage: ResolverTypeWrapper<ExternalResultCodePage>;
  ExternalResultCodeTarget: ResolverTypeWrapper<ExternalResultCodeTarget>;
  ExternalSurveyQuestion: ResolverTypeWrapper<ExternalSurveyQuestion>;
  ExternalSurveyQuestionEdge: ResolverTypeWrapper<ExternalSurveyQuestionEdge>;
  ExternalSurveyQuestionFilter: ExternalSurveyQuestionFilter;
  ExternalSurveyQuestionPage: ResolverTypeWrapper<ExternalSurveyQuestionPage>;
  ExternalSurveyQuestionResponseOption: ResolverTypeWrapper<ExternalSurveyQuestionResponseOption>;
  ExternalSurveyQuestionResponseOptionEdge: ResolverTypeWrapper<ExternalSurveyQuestionResponseOptionEdge>;
  ExternalSurveyQuestionResponseOptionPage: ResolverTypeWrapper<ExternalSurveyQuestionResponseOptionPage>;
  ExternalSurveyQuestionResponseOptionTarget: ResolverTypeWrapper<ExternalSurveyQuestionResponseOptionTarget>;
  ExternalSyncConfigTarget: ResolversTypes['ExternalActivistCodeTarget'] | ResolversTypes['ExternalResultCodeTarget'] | ResolversTypes['ExternalSurveyQuestionResponseOptionTarget'];
  ExternalSyncConfigTargetEdge: ResolverTypeWrapper<Omit<ExternalSyncConfigTargetEdge, 'node'> & { node: ResolversTypes['ExternalSyncConfigTarget'] }>;
  ExternalSyncConfigTargetPage: ResolverTypeWrapper<ExternalSyncConfigTargetPage>;
  ExternalSyncQuestionResponseConfig: ResolverTypeWrapper<Omit<ExternalSyncQuestionResponseConfig, 'targets'> & { targets?: Maybe<Array<Maybe<ResolversTypes['ExternalSyncConfigTarget']>>> }>;
  ExternalSyncQuestionResponseConfigEdge: ResolverTypeWrapper<ExternalSyncQuestionResponseConfigEdge>;
  ExternalSyncQuestionResponseConfigPage: ResolverTypeWrapper<ExternalSyncQuestionResponseConfigPage>;
  ExternalSyncReadinessState: ExternalSyncReadinessState;
  ExternalSyncTagConfig: ResolverTypeWrapper<ExternalSyncTagConfig>;
  ExternalSyncTagConfigEdge: ResolverTypeWrapper<ExternalSyncTagConfigEdge>;
  ExternalSyncTagConfigPage: ResolverTypeWrapper<ExternalSyncTagConfigPage>;
  ExternalSystem: ResolverTypeWrapper<ExternalSystem>;
  ExternalSystemEdge: ResolverTypeWrapper<ExternalSystemEdge>;
  ExternalSystemInput: ExternalSystemInput;
  ExternalSystemPage: ResolverTypeWrapper<ExternalSystemPage>;
  ExternalSystemType: ExternalSystemType;
  FetchCampaignOverlapInput: FetchCampaignOverlapInput;
  FetchCampaignOverlapResult: ResolverTypeWrapper<FetchCampaignOverlapResult>;
  Float: ResolverTypeWrapper<Scalars['Float']>;
  FoundContact: ResolverTypeWrapper<FoundContact>;
  ID: ResolverTypeWrapper<Scalars['ID']>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  InteractionStep: ResolverTypeWrapper<InteractionStep>;
  InteractionStepInput: InteractionStepInput;
  Invite: ResolverTypeWrapper<Invite>;
  InviteInput: InviteInput;
  JSON: ResolverTypeWrapper<Scalars['JSON']>;
  JobRequest: ResolverTypeWrapper<JobRequest>;
  LinkDomain: ResolverTypeWrapper<LinkDomain>;
  Location: ResolverTypeWrapper<Location>;
  MembershipFilter: MembershipFilter;
  Message: ResolverTypeWrapper<Message>;
  MessageInput: MessageInput;
  MessagingService: ResolverTypeWrapper<MessagingService>;
  MessagingServiceEdge: ResolverTypeWrapper<MessagingServiceEdge>;
  MessagingServicePage: ResolverTypeWrapper<MessagingServicePage>;
  MessagingServiceType: MessagingServiceType;
  Notice: ResolversTypes['Register10DlcBrandNotice'];
  NoticeEdge: ResolverTypeWrapper<Omit<NoticeEdge, 'node'> & { node: ResolversTypes['Notice'] }>;
  NoticePage: ResolverTypeWrapper<NoticePage>;
  OffsetLimitCursor: OffsetLimitCursor;
  OptOut: ResolverTypeWrapper<OptOut>;
  Organization: ResolverTypeWrapper<Organization>;
  OrganizationMembership: ResolverTypeWrapper<OrganizationMembership>;
  OrganizationMembershipEdge: ResolverTypeWrapper<OrganizationMembershipEdge>;
  OrganizationMembershipPage: ResolverTypeWrapper<OrganizationMembershipPage>;
  OrganizationSettings: ResolverTypeWrapper<OrganizationSettings>;
  OrganizationSettingsInput: OrganizationSettingsInput;
  PageInfo: ResolverTypeWrapper<PageInfo>;
  PaginatedCampaigns: ResolverTypeWrapper<PaginatedCampaigns>;
  PaginatedConversations: ResolverTypeWrapper<PaginatedConversations>;
  PaginatedUsers: ResolverTypeWrapper<PaginatedUsers>;
  Phone: ResolverTypeWrapper<Scalars['Phone']>;
  Question: ResolverTypeWrapper<Question>;
  QuestionResponse: ResolverTypeWrapper<QuestionResponse>;
  QuestionResponseInput: QuestionResponseInput;
  QuestionResponseSyncConfigInput: QuestionResponseSyncConfigInput;
  QuestionResponseSyncTargetInput: QuestionResponseSyncTargetInput;
  Register10DlcBrandNotice: ResolverTypeWrapper<Register10DlcBrandNotice>;
  RelayPageInfo: ResolverTypeWrapper<RelayPageInfo>;
  ReleaseActionTarget: ReleaseActionTarget;
  ReleaseAllUnhandledRepliesResult: ResolverTypeWrapper<ReleaseAllUnhandledRepliesResult>;
  RequestAutoApprove: RequestAutoApprove;
  ReturnString: ResolverTypeWrapper<ReturnString>;
  RootMutation: ResolverTypeWrapper<{}>;
  RootQuery: ResolverTypeWrapper<{}>;
  ScriptUpdateResult: ResolverTypeWrapper<ScriptUpdateResult>;
  SecondPassInput: SecondPassInput;
  String: ResolverTypeWrapper<Scalars['String']>;
  SyncCampaignToSystemInput: SyncCampaignToSystemInput;
  Tag: ResolverTypeWrapper<Tag>;
  TagInput: TagInput;
  TagsFilter: TagsFilter;
  Team: ResolverTypeWrapper<Team>;
  TeamInput: TeamInput;
  TextRequestType: TextRequestType;
  TexterAssignmentInput: TexterAssignmentInput;
  TexterInput: TexterInput;
  TrollAlarm: ResolverTypeWrapper<TrollAlarm>;
  TrollAlarmCount: ResolverTypeWrapper<TrollAlarmCount>;
  TrollAlarmPage: ResolverTypeWrapper<TrollAlarmPage>;
  TrollTrigger: ResolverTypeWrapper<TrollTrigger>;
  TrollTriggerInput: TrollTriggerInput;
  TrollTriggerMode: TrollTriggerMode;
  UnhealthyLinkDomain: ResolverTypeWrapper<UnhealthyLinkDomain>;
  UpdateLinkDomain: UpdateLinkDomain;
  Upload: ResolverTypeWrapper<Scalars['Upload']>;
  User: ResolverTypeWrapper<User>;
  UserInput: UserInput;
  UserPasswordChange: UserPasswordChange;
  UserRole: UserRole;
  UsersList: ResolverTypeWrapper<UsersList>;
  UsersReturn: ResolversTypes['PaginatedUsers'] | ResolversTypes['UsersList'];
  VanOperationMode: VanOperationMode;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Action: Action;
  AnswerOption: AnswerOption;
  AnswerOptionInput: AnswerOptionInput;
  Assignment: Assignment;
  AssignmentRequest: AssignmentRequest;
  AssignmentTarget: AssignmentTarget;
  AssignmentsFilter: AssignmentsFilter;
  Boolean: Scalars['Boolean'];
  BulkUpdateScriptInput: BulkUpdateScriptInput;
  Campaign: Campaign;
  CampaignContact: CampaignContact;
  CampaignContactInput: CampaignContactInput;
  CampaignDeliverabilityStats: CampaignDeliverabilityStats;
  CampaignEdge: CampaignEdge;
  CampaignExportInput: CampaignExportInput;
  CampaignGroup: CampaignGroup;
  CampaignGroupEdge: CampaignGroupEdge;
  CampaignGroupInput: CampaignGroupInput;
  CampaignGroupPage: CampaignGroupPage;
  CampaignIdContactId: CampaignIdContactId;
  CampaignInput: CampaignInput;
  CampaignPage: CampaignPage;
  CampaignReadiness: CampaignReadiness;
  CampaignStats: CampaignStats;
  CampaignsFilter: CampaignsFilter;
  CampaignsList: CampaignsList;
  CampaignsReturn: ResolversParentTypes['CampaignsList'] | ResolversParentTypes['PaginatedCampaigns'];
  CannedResponse: CannedResponse;
  CannedResponseInput: CannedResponseInput;
  ContactActionInput: ContactActionInput;
  ContactMessage: ContactMessage;
  ContactNameFilter: ContactNameFilter;
  ContactTagActionInput: ContactTagActionInput;
  ContactsFilter: ContactsFilter;
  Conversation: Conversation;
  ConversationFilter: ConversationFilter;
  Cursor: Scalars['Cursor'];
  Date: Scalars['Date'];
  DeleteCampaignOverlapResult: DeleteCampaignOverlapResult;
  DeliverabilityErrorStat: DeliverabilityErrorStat;
  EditOrganizationInput: EditOrganizationInput;
  ExportForVanInput: ExportForVanInput;
  ExternalActivistCode: ExternalActivistCode;
  ExternalActivistCodeEdge: ExternalActivistCodeEdge;
  ExternalActivistCodeFilter: ExternalActivistCodeFilter;
  ExternalActivistCodePage: ExternalActivistCodePage;
  ExternalActivistCodeTarget: ExternalActivistCodeTarget;
  ExternalList: ExternalList;
  ExternalListEdge: ExternalListEdge;
  ExternalListPage: ExternalListPage;
  ExternalResultCode: ExternalResultCode;
  ExternalResultCodeEdge: ExternalResultCodeEdge;
  ExternalResultCodePage: ExternalResultCodePage;
  ExternalResultCodeTarget: ExternalResultCodeTarget;
  ExternalSurveyQuestion: ExternalSurveyQuestion;
  ExternalSurveyQuestionEdge: ExternalSurveyQuestionEdge;
  ExternalSurveyQuestionFilter: ExternalSurveyQuestionFilter;
  ExternalSurveyQuestionPage: ExternalSurveyQuestionPage;
  ExternalSurveyQuestionResponseOption: ExternalSurveyQuestionResponseOption;
  ExternalSurveyQuestionResponseOptionEdge: ExternalSurveyQuestionResponseOptionEdge;
  ExternalSurveyQuestionResponseOptionPage: ExternalSurveyQuestionResponseOptionPage;
  ExternalSurveyQuestionResponseOptionTarget: ExternalSurveyQuestionResponseOptionTarget;
  ExternalSyncConfigTarget: ResolversParentTypes['ExternalActivistCodeTarget'] | ResolversParentTypes['ExternalResultCodeTarget'] | ResolversParentTypes['ExternalSurveyQuestionResponseOptionTarget'];
  ExternalSyncConfigTargetEdge: Omit<ExternalSyncConfigTargetEdge, 'node'> & { node: ResolversParentTypes['ExternalSyncConfigTarget'] };
  ExternalSyncConfigTargetPage: ExternalSyncConfigTargetPage;
  ExternalSyncQuestionResponseConfig: Omit<ExternalSyncQuestionResponseConfig, 'targets'> & { targets?: Maybe<Array<Maybe<ResolversParentTypes['ExternalSyncConfigTarget']>>> };
  ExternalSyncQuestionResponseConfigEdge: ExternalSyncQuestionResponseConfigEdge;
  ExternalSyncQuestionResponseConfigPage: ExternalSyncQuestionResponseConfigPage;
  ExternalSyncTagConfig: ExternalSyncTagConfig;
  ExternalSyncTagConfigEdge: ExternalSyncTagConfigEdge;
  ExternalSyncTagConfigPage: ExternalSyncTagConfigPage;
  ExternalSystem: ExternalSystem;
  ExternalSystemEdge: ExternalSystemEdge;
  ExternalSystemInput: ExternalSystemInput;
  ExternalSystemPage: ExternalSystemPage;
  FetchCampaignOverlapInput: FetchCampaignOverlapInput;
  FetchCampaignOverlapResult: FetchCampaignOverlapResult;
  Float: Scalars['Float'];
  FoundContact: FoundContact;
  ID: Scalars['ID'];
  Int: Scalars['Int'];
  InteractionStep: InteractionStep;
  InteractionStepInput: InteractionStepInput;
  Invite: Invite;
  InviteInput: InviteInput;
  JSON: Scalars['JSON'];
  JobRequest: JobRequest;
  LinkDomain: LinkDomain;
  Location: Location;
  MembershipFilter: MembershipFilter;
  Message: Message;
  MessageInput: MessageInput;
  MessagingService: MessagingService;
  MessagingServiceEdge: MessagingServiceEdge;
  MessagingServicePage: MessagingServicePage;
  Notice: ResolversParentTypes['Register10DlcBrandNotice'];
  NoticeEdge: Omit<NoticeEdge, 'node'> & { node: ResolversParentTypes['Notice'] };
  NoticePage: NoticePage;
  OffsetLimitCursor: OffsetLimitCursor;
  OptOut: OptOut;
  Organization: Organization;
  OrganizationMembership: OrganizationMembership;
  OrganizationMembershipEdge: OrganizationMembershipEdge;
  OrganizationMembershipPage: OrganizationMembershipPage;
  OrganizationSettings: OrganizationSettings;
  OrganizationSettingsInput: OrganizationSettingsInput;
  PageInfo: PageInfo;
  PaginatedCampaigns: PaginatedCampaigns;
  PaginatedConversations: PaginatedConversations;
  PaginatedUsers: PaginatedUsers;
  Phone: Scalars['Phone'];
  Question: Question;
  QuestionResponse: QuestionResponse;
  QuestionResponseInput: QuestionResponseInput;
  QuestionResponseSyncConfigInput: QuestionResponseSyncConfigInput;
  QuestionResponseSyncTargetInput: QuestionResponseSyncTargetInput;
  Register10DlcBrandNotice: Register10DlcBrandNotice;
  RelayPageInfo: RelayPageInfo;
  ReleaseAllUnhandledRepliesResult: ReleaseAllUnhandledRepliesResult;
  ReturnString: ReturnString;
  RootMutation: {};
  RootQuery: {};
  ScriptUpdateResult: ScriptUpdateResult;
  SecondPassInput: SecondPassInput;
  String: Scalars['String'];
  SyncCampaignToSystemInput: SyncCampaignToSystemInput;
  Tag: Tag;
  TagInput: TagInput;
  TagsFilter: TagsFilter;
  Team: Team;
  TeamInput: TeamInput;
  TexterAssignmentInput: TexterAssignmentInput;
  TexterInput: TexterInput;
  TrollAlarm: TrollAlarm;
  TrollAlarmCount: TrollAlarmCount;
  TrollAlarmPage: TrollAlarmPage;
  TrollTrigger: TrollTrigger;
  TrollTriggerInput: TrollTriggerInput;
  UnhealthyLinkDomain: UnhealthyLinkDomain;
  UpdateLinkDomain: UpdateLinkDomain;
  Upload: Scalars['Upload'];
  User: User;
  UserInput: UserInput;
  UserPasswordChange: UserPasswordChange;
  UsersList: UsersList;
  UsersReturn: ResolversParentTypes['PaginatedUsers'] | ResolversParentTypes['UsersList'];
};

export type ActionResolvers<ContextType = any, ParentType extends ResolversParentTypes['Action'] = ResolversParentTypes['Action']> = {
  display_name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  instructions?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AnswerOptionResolvers<ContextType = any, ParentType extends ResolversParentTypes['AnswerOption'] = ResolversParentTypes['AnswerOption']> = {
  action?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  interactionStepId?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  nextInteractionStep?: Resolver<Maybe<ResolversTypes['InteractionStep']>, ParentType, ContextType>;
  question?: Resolver<Maybe<ResolversTypes['Question']>, ParentType, ContextType>;
  responderCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  responders?: Resolver<Maybe<Array<Maybe<ResolversTypes['CampaignContact']>>>, ParentType, ContextType>;
  value?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AssignmentResolvers<ContextType = any, ParentType extends ResolversParentTypes['Assignment'] = ResolversParentTypes['Assignment']> = {
  campaign?: Resolver<Maybe<ResolversTypes['Campaign']>, ParentType, ContextType>;
  campaignCannedResponses?: Resolver<Maybe<Array<Maybe<ResolversTypes['CannedResponse']>>>, ParentType, ContextType>;
  contacts?: Resolver<Maybe<Array<Maybe<ResolversTypes['CampaignContact']>>>, ParentType, ContextType, RequireFields<AssignmentContactsArgs, never>>;
  contactsCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType, RequireFields<AssignmentContactsCountArgs, never>>;
  id?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  maxContacts?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  texter?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  userCannedResponses?: Resolver<Maybe<Array<Maybe<ResolversTypes['CannedResponse']>>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AssignmentRequestResolvers<ContextType = any, ParentType extends ResolversParentTypes['AssignmentRequest'] = ResolversParentTypes['AssignmentRequest']> = {
  amount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  organization?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AssignmentTargetResolvers<ContextType = any, ParentType extends ResolversParentTypes['AssignmentTarget'] = ResolversParentTypes['AssignmentTarget']> = {
  campaign?: Resolver<Maybe<ResolversTypes['Campaign']>, ParentType, ContextType>;
  countLeft?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  enabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  maxRequestCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  teamId?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  teamTitle?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CampaignResolvers<ContextType = any, ParentType extends ResolversParentTypes['Campaign'] = ResolversParentTypes['Campaign']> = {
  assignments?: Resolver<Maybe<Array<Maybe<ResolversTypes['Assignment']>>>, ParentType, ContextType, RequireFields<CampaignAssignmentsArgs, never>>;
  campaignGroups?: Resolver<ResolversTypes['CampaignGroupPage'], ParentType, ContextType>;
  cannedResponses?: Resolver<Maybe<Array<Maybe<ResolversTypes['CannedResponse']>>>, ParentType, ContextType, RequireFields<CampaignCannedResponsesArgs, never>>;
  contacts?: Resolver<Maybe<Array<Maybe<ResolversTypes['CampaignContact']>>>, ParentType, ContextType>;
  contactsCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  creator?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  customFields?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  datawarehouseAvailable?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  deliverabilityStats?: Resolver<ResolversTypes['CampaignDeliverabilityStats'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  dueBy?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  editors?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  externalSyncConfigurations?: Resolver<ResolversTypes['ExternalSyncQuestionResponseConfigPage'], ParentType, ContextType, RequireFields<CampaignExternalSyncConfigurationsArgs, never>>;
  externalSystem?: Resolver<Maybe<ResolversTypes['ExternalSystem']>, ParentType, ContextType>;
  hasUnassignedContacts?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  hasUnhandledMessages?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  hasUnsentInitialMessages?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  id?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  interactionSteps?: Resolver<Maybe<Array<Maybe<ResolversTypes['InteractionStep']>>>, ParentType, ContextType>;
  introHtml?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  isArchived?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  isAssignmentLimitedToTeams?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isAutoassignEnabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isStarted?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  landlinesFiltered?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  logoImageUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  organization?: Resolver<Maybe<ResolversTypes['Organization']>, ParentType, ContextType>;
  pendingJobs?: Resolver<Array<Maybe<ResolversTypes['JobRequest']>>, ParentType, ContextType, RequireFields<CampaignPendingJobsArgs, never>>;
  previewUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  primaryColor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  readiness?: Resolver<ResolversTypes['CampaignReadiness'], ParentType, ContextType>;
  repliesStaleAfter?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  stats?: Resolver<Maybe<ResolversTypes['CampaignStats']>, ParentType, ContextType>;
  syncReadiness?: Resolver<ResolversTypes['ExternalSyncReadinessState'], ParentType, ContextType>;
  teams?: Resolver<Array<Maybe<ResolversTypes['Team']>>, ParentType, ContextType>;
  texters?: Resolver<Maybe<Array<Maybe<ResolversTypes['User']>>>, ParentType, ContextType>;
  textingHoursEnd?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  textingHoursStart?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  timezone?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  useDynamicAssignment?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CampaignContactResolvers<ContextType = any, ParentType extends ResolversParentTypes['CampaignContact'] = ResolversParentTypes['CampaignContact']> = {
  assignmentId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  campaign?: Resolver<Maybe<ResolversTypes['Campaign']>, ParentType, ContextType>;
  cell?: Resolver<Maybe<ResolversTypes['Phone']>, ParentType, ContextType>;
  contactTags?: Resolver<Maybe<Array<Maybe<ResolversTypes['Tag']>>>, ParentType, ContextType>;
  customFields?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  external_id?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  firstName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  interactionSteps?: Resolver<Maybe<Array<Maybe<ResolversTypes['InteractionStep']>>>, ParentType, ContextType>;
  lastName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  location?: Resolver<Maybe<ResolversTypes['Location']>, ParentType, ContextType>;
  messageStatus?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  messages?: Resolver<Maybe<Array<Maybe<ResolversTypes['Message']>>>, ParentType, ContextType>;
  optOut?: Resolver<Maybe<ResolversTypes['OptOut']>, ParentType, ContextType>;
  questionResponseValues?: Resolver<Maybe<Array<Maybe<ResolversTypes['AnswerOption']>>>, ParentType, ContextType>;
  questionResponses?: Resolver<Maybe<Array<Maybe<ResolversTypes['AnswerOption']>>>, ParentType, ContextType>;
  timezone?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  zip?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CampaignDeliverabilityStatsResolvers<ContextType = any, ParentType extends ResolversParentTypes['CampaignDeliverabilityStats'] = ResolversParentTypes['CampaignDeliverabilityStats']> = {
  deliveredCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  errorCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  sendingCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  sentCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  specificErrors?: Resolver<Maybe<Array<Maybe<ResolversTypes['DeliverabilityErrorStat']>>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CampaignEdgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['CampaignEdge'] = ResolversParentTypes['CampaignEdge']> = {
  cursor?: Resolver<ResolversTypes['Cursor'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Campaign'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CampaignGroupResolvers<ContextType = any, ParentType extends ResolversParentTypes['CampaignGroup'] = ResolversParentTypes['CampaignGroup']> = {
  campaigns?: Resolver<ResolversTypes['CampaignPage'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  organizationId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CampaignGroupEdgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['CampaignGroupEdge'] = ResolversParentTypes['CampaignGroupEdge']> = {
  cursor?: Resolver<ResolversTypes['Cursor'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['CampaignGroup'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CampaignGroupPageResolvers<ContextType = any, ParentType extends ResolversParentTypes['CampaignGroupPage'] = ResolversParentTypes['CampaignGroupPage']> = {
  edges?: Resolver<Array<ResolversTypes['CampaignGroupEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['RelayPageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CampaignPageResolvers<ContextType = any, ParentType extends ResolversParentTypes['CampaignPage'] = ResolversParentTypes['CampaignPage']> = {
  edges?: Resolver<Array<ResolversTypes['CampaignEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['RelayPageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CampaignReadinessResolvers<ContextType = any, ParentType extends ResolversParentTypes['CampaignReadiness'] = ResolversParentTypes['CampaignReadiness']> = {
  autoassign?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  basics?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  campaignGroups?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  cannedResponses?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  contacts?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  integration?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  interactions?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  texters?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  textingHours?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CampaignStatsResolvers<ContextType = any, ParentType extends ResolversParentTypes['CampaignStats'] = ResolversParentTypes['CampaignStats']> = {
  optOutsCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  receivedMessagesCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  sentMessagesCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CampaignsListResolvers<ContextType = any, ParentType extends ResolversParentTypes['CampaignsList'] = ResolversParentTypes['CampaignsList']> = {
  campaigns?: Resolver<Maybe<Array<Maybe<ResolversTypes['Campaign']>>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CampaignsReturnResolvers<ContextType = any, ParentType extends ResolversParentTypes['CampaignsReturn'] = ResolversParentTypes['CampaignsReturn']> = {
  __resolveType: TypeResolveFn<'CampaignsList' | 'PaginatedCampaigns', ParentType, ContextType>;
};

export type CannedResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['CannedResponse'] = ResolversParentTypes['CannedResponse']> = {
  id?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  isUserCreated?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  text?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ConversationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Conversation'] = ResolversParentTypes['Conversation']> = {
  campaign?: Resolver<ResolversTypes['Campaign'], ParentType, ContextType>;
  contact?: Resolver<ResolversTypes['CampaignContact'], ParentType, ContextType>;
  texter?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface CursorScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Cursor'], any> {
  name: 'Cursor';
}

export interface DateScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Date'], any> {
  name: 'Date';
}

export type DeleteCampaignOverlapResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['DeleteCampaignOverlapResult'] = ResolversParentTypes['DeleteCampaignOverlapResult']> = {
  campaign?: Resolver<Maybe<ResolversTypes['Campaign']>, ParentType, ContextType>;
  deletedRowCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  remainingCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DeliverabilityErrorStatResolvers<ContextType = any, ParentType extends ResolversParentTypes['DeliverabilityErrorStat'] = ResolversParentTypes['DeliverabilityErrorStat']> = {
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  errorCode?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ExternalActivistCodeResolvers<ContextType = any, ParentType extends ResolversParentTypes['ExternalActivistCode'] = ResolversParentTypes['ExternalActivistCode']> = {
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  externalId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  mediumName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  scriptQuestion?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  shortName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['ExternalDataCollectionStatus'], ParentType, ContextType>;
  systemId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ExternalActivistCodeEdgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['ExternalActivistCodeEdge'] = ResolversParentTypes['ExternalActivistCodeEdge']> = {
  cursor?: Resolver<ResolversTypes['Cursor'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['ExternalActivistCode'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ExternalActivistCodePageResolvers<ContextType = any, ParentType extends ResolversParentTypes['ExternalActivistCodePage'] = ResolversParentTypes['ExternalActivistCodePage']> = {
  edges?: Resolver<Array<ResolversTypes['ExternalActivistCodeEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['RelayPageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ExternalActivistCodeTargetResolvers<ContextType = any, ParentType extends ResolversParentTypes['ExternalActivistCodeTarget'] = ResolversParentTypes['ExternalActivistCodeTarget']> = {
  activistCode?: Resolver<ResolversTypes['ExternalActivistCode'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ExternalListResolvers<ContextType = any, ParentType extends ResolversParentTypes['ExternalList'] = ResolversParentTypes['ExternalList']> = {
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  doorCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  externalId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  listCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  systemId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ExternalListEdgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['ExternalListEdge'] = ResolversParentTypes['ExternalListEdge']> = {
  cursor?: Resolver<ResolversTypes['Cursor'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['ExternalList'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ExternalListPageResolvers<ContextType = any, ParentType extends ResolversParentTypes['ExternalListPage'] = ResolversParentTypes['ExternalListPage']> = {
  edges?: Resolver<Array<ResolversTypes['ExternalListEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['RelayPageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ExternalResultCodeResolvers<ContextType = any, ParentType extends ResolversParentTypes['ExternalResultCode'] = ResolversParentTypes['ExternalResultCode']> = {
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  externalId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  mediumName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  shortName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  systemId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ExternalResultCodeEdgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['ExternalResultCodeEdge'] = ResolversParentTypes['ExternalResultCodeEdge']> = {
  cursor?: Resolver<ResolversTypes['Cursor'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['ExternalResultCode'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ExternalResultCodePageResolvers<ContextType = any, ParentType extends ResolversParentTypes['ExternalResultCodePage'] = ResolversParentTypes['ExternalResultCodePage']> = {
  edges?: Resolver<Array<ResolversTypes['ExternalResultCodeEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['RelayPageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ExternalResultCodeTargetResolvers<ContextType = any, ParentType extends ResolversParentTypes['ExternalResultCodeTarget'] = ResolversParentTypes['ExternalResultCodeTarget']> = {
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  resultCode?: Resolver<ResolversTypes['ExternalResultCode'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ExternalSurveyQuestionResolvers<ContextType = any, ParentType extends ResolversParentTypes['ExternalSurveyQuestion'] = ResolversParentTypes['ExternalSurveyQuestion']> = {
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  cycle?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  externalId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  mediumName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  responseOptions?: Resolver<ResolversTypes['ExternalSurveyQuestionResponseOptionPage'], ParentType, ContextType, RequireFields<ExternalSurveyQuestionResponseOptionsArgs, never>>;
  scriptQuestion?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  shortName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['ExternalDataCollectionStatus'], ParentType, ContextType>;
  systemId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ExternalSurveyQuestionEdgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['ExternalSurveyQuestionEdge'] = ResolversParentTypes['ExternalSurveyQuestionEdge']> = {
  cursor?: Resolver<ResolversTypes['Cursor'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['ExternalSurveyQuestion'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ExternalSurveyQuestionPageResolvers<ContextType = any, ParentType extends ResolversParentTypes['ExternalSurveyQuestionPage'] = ResolversParentTypes['ExternalSurveyQuestionPage']> = {
  edges?: Resolver<Array<ResolversTypes['ExternalSurveyQuestionEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['RelayPageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ExternalSurveyQuestionResponseOptionResolvers<ContextType = any, ParentType extends ResolversParentTypes['ExternalSurveyQuestionResponseOption'] = ResolversParentTypes['ExternalSurveyQuestionResponseOption']> = {
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  externalId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  externalSurveyQuestionId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  mediumName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  shortName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ExternalSurveyQuestionResponseOptionEdgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['ExternalSurveyQuestionResponseOptionEdge'] = ResolversParentTypes['ExternalSurveyQuestionResponseOptionEdge']> = {
  cursor?: Resolver<ResolversTypes['Cursor'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['ExternalSurveyQuestionResponseOption'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ExternalSurveyQuestionResponseOptionPageResolvers<ContextType = any, ParentType extends ResolversParentTypes['ExternalSurveyQuestionResponseOptionPage'] = ResolversParentTypes['ExternalSurveyQuestionResponseOptionPage']> = {
  edges?: Resolver<Array<ResolversTypes['ExternalSurveyQuestionResponseOptionEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['RelayPageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ExternalSurveyQuestionResponseOptionTargetResolvers<ContextType = any, ParentType extends ResolversParentTypes['ExternalSurveyQuestionResponseOptionTarget'] = ResolversParentTypes['ExternalSurveyQuestionResponseOptionTarget']> = {
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  responseOption?: Resolver<ResolversTypes['ExternalSurveyQuestionResponseOption'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ExternalSyncConfigTargetResolvers<ContextType = any, ParentType extends ResolversParentTypes['ExternalSyncConfigTarget'] = ResolversParentTypes['ExternalSyncConfigTarget']> = {
  __resolveType: TypeResolveFn<'ExternalActivistCodeTarget' | 'ExternalResultCodeTarget' | 'ExternalSurveyQuestionResponseOptionTarget', ParentType, ContextType>;
};

export type ExternalSyncConfigTargetEdgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['ExternalSyncConfigTargetEdge'] = ResolversParentTypes['ExternalSyncConfigTargetEdge']> = {
  cursor?: Resolver<ResolversTypes['Cursor'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['ExternalSyncConfigTarget'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ExternalSyncConfigTargetPageResolvers<ContextType = any, ParentType extends ResolversParentTypes['ExternalSyncConfigTargetPage'] = ResolversParentTypes['ExternalSyncConfigTargetPage']> = {
  edges?: Resolver<Array<ResolversTypes['ExternalSyncConfigTargetEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['RelayPageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ExternalSyncQuestionResponseConfigResolvers<ContextType = any, ParentType extends ResolversParentTypes['ExternalSyncQuestionResponseConfig'] = ResolversParentTypes['ExternalSyncQuestionResponseConfig']> = {
  campaignId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  includesNotActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  interactionStep?: Resolver<ResolversTypes['InteractionStep'], ParentType, ContextType>;
  interactionStepId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isMissing?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isRequired?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  questionResponseValue?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  targets?: Resolver<Maybe<Array<Maybe<ResolversTypes['ExternalSyncConfigTarget']>>>, ParentType, ContextType, RequireFields<ExternalSyncQuestionResponseConfigTargetsArgs, never>>;
  updatedAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ExternalSyncQuestionResponseConfigEdgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['ExternalSyncQuestionResponseConfigEdge'] = ResolversParentTypes['ExternalSyncQuestionResponseConfigEdge']> = {
  cursor?: Resolver<ResolversTypes['Cursor'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['ExternalSyncQuestionResponseConfig'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ExternalSyncQuestionResponseConfigPageResolvers<ContextType = any, ParentType extends ResolversParentTypes['ExternalSyncQuestionResponseConfigPage'] = ResolversParentTypes['ExternalSyncQuestionResponseConfigPage']> = {
  edges?: Resolver<Array<ResolversTypes['ExternalSyncQuestionResponseConfigEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['RelayPageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ExternalSyncTagConfigResolvers<ContextType = any, ParentType extends ResolversParentTypes['ExternalSyncTagConfig'] = ResolversParentTypes['ExternalSyncTagConfig']> = {
  createdAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  includesNotActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isMissing?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isRequired?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  systemId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  tag?: Resolver<ResolversTypes['Tag'], ParentType, ContextType>;
  tagId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  targets?: Resolver<Maybe<ResolversTypes['ExternalSyncConfigTargetPage']>, ParentType, ContextType, RequireFields<ExternalSyncTagConfigTargetsArgs, never>>;
  updatedAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ExternalSyncTagConfigEdgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['ExternalSyncTagConfigEdge'] = ResolversParentTypes['ExternalSyncTagConfigEdge']> = {
  cursor?: Resolver<ResolversTypes['Cursor'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['ExternalSyncTagConfig'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ExternalSyncTagConfigPageResolvers<ContextType = any, ParentType extends ResolversParentTypes['ExternalSyncTagConfigPage'] = ResolversParentTypes['ExternalSyncTagConfigPage']> = {
  edges?: Resolver<Array<ResolversTypes['ExternalSyncTagConfigEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['RelayPageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ExternalSystemResolvers<ContextType = any, ParentType extends ResolversParentTypes['ExternalSystem'] = ResolversParentTypes['ExternalSystem']> = {
  activistCodes?: Resolver<ResolversTypes['ExternalActivistCodePage'], ParentType, ContextType, RequireFields<ExternalSystemActivistCodesArgs, never>>;
  apiKey?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  lists?: Resolver<ResolversTypes['ExternalListPage'], ParentType, ContextType, RequireFields<ExternalSystemListsArgs, never>>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  operationMode?: Resolver<ResolversTypes['VanOperationMode'], ParentType, ContextType>;
  optOutSyncConfig?: Resolver<Maybe<ResolversTypes['ExternalResultCodeTarget']>, ParentType, ContextType>;
  organizationId?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  resultCodes?: Resolver<ResolversTypes['ExternalResultCodePage'], ParentType, ContextType, RequireFields<ExternalSystemResultCodesArgs, never>>;
  surveyQuestions?: Resolver<ResolversTypes['ExternalSurveyQuestionPage'], ParentType, ContextType, RequireFields<ExternalSystemSurveyQuestionsArgs, never>>;
  syncedAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['ExternalSystemType'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  username?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ExternalSystemEdgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['ExternalSystemEdge'] = ResolversParentTypes['ExternalSystemEdge']> = {
  cursor?: Resolver<ResolversTypes['Cursor'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['ExternalSystem'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ExternalSystemPageResolvers<ContextType = any, ParentType extends ResolversParentTypes['ExternalSystemPage'] = ResolversParentTypes['ExternalSystemPage']> = {
  edges?: Resolver<Array<ResolversTypes['ExternalSystemEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['RelayPageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FetchCampaignOverlapResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['FetchCampaignOverlapResult'] = ResolversParentTypes['FetchCampaignOverlapResult']> = {
  campaign?: Resolver<ResolversTypes['Campaign'], ParentType, ContextType>;
  lastActivity?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  overlapCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FoundContactResolvers<ContextType = any, ParentType extends ResolversParentTypes['FoundContact'] = ResolversParentTypes['FoundContact']> = {
  found?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type InteractionStepResolvers<ContextType = any, ParentType extends ResolversParentTypes['InteractionStep'] = ResolversParentTypes['InteractionStep']> = {
  answerActions?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  answerOption?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isDeleted?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  parentInteractionId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  question?: Resolver<Maybe<ResolversTypes['Question']>, ParentType, ContextType>;
  questionResponse?: Resolver<Maybe<ResolversTypes['QuestionResponse']>, ParentType, ContextType, RequireFields<InteractionStepQuestionResponseArgs, never>>;
  questionText?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  scriptOptions?: Resolver<Array<Maybe<ResolversTypes['String']>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type InviteResolvers<ContextType = any, ParentType extends ResolversParentTypes['Invite'] = ResolversParentTypes['Invite']> = {
  hash?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  isValid?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSON'], any> {
  name: 'JSON';
}

export type JobRequestResolvers<ContextType = any, ParentType extends ResolversParentTypes['JobRequest'] = ResolversParentTypes['JobRequest']> = {
  assigned?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  jobType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  resultMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LinkDomainResolvers<ContextType = any, ParentType extends ResolversParentTypes['LinkDomain'] = ResolversParentTypes['LinkDomain']> = {
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  currentUsageCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  cycledOutAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  domain?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isHealthy?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isManuallyDisabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  maxUsageCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LocationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Location'] = ResolversParentTypes['Location']> = {
  city?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  state?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MessageResolvers<ContextType = any, ParentType extends ResolversParentTypes['Message'] = ResolversParentTypes['Message']> = {
  assignment?: Resolver<Maybe<ResolversTypes['Assignment']>, ParentType, ContextType>;
  campaignId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  contactNumber?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  id?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  isFromContact?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  sendStatus?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  text?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  userId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  userNumber?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MessagingServiceResolvers<ContextType = any, ParentType extends ResolversParentTypes['MessagingService'] = ResolversParentTypes['MessagingService']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  messagingServiceSid?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  serviceType?: Resolver<ResolversTypes['MessagingServiceType'], ParentType, ContextType>;
  tcrBrandRegistrationLink?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MessagingServiceEdgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['MessagingServiceEdge'] = ResolversParentTypes['MessagingServiceEdge']> = {
  cursor?: Resolver<ResolversTypes['Cursor'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['MessagingService'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MessagingServicePageResolvers<ContextType = any, ParentType extends ResolversParentTypes['MessagingServicePage'] = ResolversParentTypes['MessagingServicePage']> = {
  edges?: Resolver<Array<ResolversTypes['MessagingServiceEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['RelayPageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NoticeResolvers<ContextType = any, ParentType extends ResolversParentTypes['Notice'] = ResolversParentTypes['Notice']> = {
  __resolveType: TypeResolveFn<'Register10DlcBrandNotice', ParentType, ContextType>;
};

export type NoticeEdgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['NoticeEdge'] = ResolversParentTypes['NoticeEdge']> = {
  cursor?: Resolver<ResolversTypes['Cursor'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Notice'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NoticePageResolvers<ContextType = any, ParentType extends ResolversParentTypes['NoticePage'] = ResolversParentTypes['NoticePage']> = {
  edges?: Resolver<Array<ResolversTypes['NoticeEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['RelayPageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type OptOutResolvers<ContextType = any, ParentType extends ResolversParentTypes['OptOut'] = ResolversParentTypes['OptOut']> = {
  assignment?: Resolver<Maybe<ResolversTypes['Assignment']>, ParentType, ContextType>;
  cell?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  id?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type OrganizationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Organization'] = ResolversParentTypes['Organization']> = {
  campaignGroups?: Resolver<ResolversTypes['CampaignGroupPage'], ParentType, ContextType, RequireFields<OrganizationCampaignGroupsArgs, never>>;
  campaigns?: Resolver<Maybe<ResolversTypes['PaginatedCampaigns']>, ParentType, ContextType, RequireFields<OrganizationCampaignsArgs, never>>;
  campaignsRelay?: Resolver<ResolversTypes['CampaignPage'], ParentType, ContextType, RequireFields<OrganizationCampaignsRelayArgs, never>>;
  currentAssignmentTargets?: Resolver<Array<Maybe<ResolversTypes['AssignmentTarget']>>, ParentType, ContextType>;
  escalatedConversationCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  escalationTagList?: Resolver<Maybe<Array<Maybe<ResolversTypes['Tag']>>>, ParentType, ContextType>;
  externalSystems?: Resolver<ResolversTypes['ExternalSystemPage'], ParentType, ContextType, RequireFields<OrganizationExternalSystemsArgs, never>>;
  id?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  linkDomains?: Resolver<Array<Maybe<ResolversTypes['LinkDomain']>>, ParentType, ContextType>;
  memberships?: Resolver<Maybe<ResolversTypes['OrganizationMembershipPage']>, ParentType, ContextType, RequireFields<OrganizationMembershipsArgs, never>>;
  messagingServices?: Resolver<ResolversTypes['MessagingServicePage'], ParentType, ContextType, RequireFields<OrganizationMessagingServicesArgs, never>>;
  myCurrentAssignmentTarget?: Resolver<Maybe<ResolversTypes['AssignmentTarget']>, ParentType, ContextType>;
  myCurrentAssignmentTargets?: Resolver<Array<Maybe<ResolversTypes['AssignmentTarget']>>, ParentType, ContextType>;
  name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  numbersApiKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  optOutMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  optOuts?: Resolver<Maybe<Array<Maybe<ResolversTypes['OptOut']>>>, ParentType, ContextType>;
  pendingAssignmentRequestCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  people?: Resolver<Maybe<Array<Maybe<ResolversTypes['User']>>>, ParentType, ContextType, RequireFields<OrganizationPeopleArgs, never>>;
  peopleCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  settings?: Resolver<ResolversTypes['OrganizationSettings'], ParentType, ContextType>;
  tagList?: Resolver<Maybe<Array<Maybe<ResolversTypes['Tag']>>>, ParentType, ContextType>;
  teams?: Resolver<Array<Maybe<ResolversTypes['Team']>>, ParentType, ContextType>;
  textRequestFormEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  textRequestMaxCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  textRequestType?: Resolver<Maybe<ResolversTypes['TextRequestType']>, ParentType, ContextType>;
  textingHoursEnd?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  textingHoursEnforced?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  textingHoursStart?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  textsAvailable?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  threeClickEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  unhealthyLinkDomains?: Resolver<Array<Maybe<ResolversTypes['UnhealthyLinkDomain']>>, ParentType, ContextType>;
  uuid?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type OrganizationMembershipResolvers<ContextType = any, ParentType extends ResolversParentTypes['OrganizationMembership'] = ResolversParentTypes['OrganizationMembership']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  organization?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  requestAutoApprove?: Resolver<ResolversTypes['RequestAutoApprove'], ParentType, ContextType>;
  role?: Resolver<ResolversTypes['UserRole'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type OrganizationMembershipEdgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['OrganizationMembershipEdge'] = ResolversParentTypes['OrganizationMembershipEdge']> = {
  cursor?: Resolver<ResolversTypes['Cursor'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['OrganizationMembership'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type OrganizationMembershipPageResolvers<ContextType = any, ParentType extends ResolversParentTypes['OrganizationMembershipPage'] = ResolversParentTypes['OrganizationMembershipPage']> = {
  edges?: Resolver<Array<ResolversTypes['OrganizationMembershipEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['RelayPageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type OrganizationSettingsResolvers<ContextType = any, ParentType extends ResolversParentTypes['OrganizationSettings'] = ResolversParentTypes['OrganizationSettings']> = {
  confirmationClickForScriptLinks?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  defaulTexterApprovalStatus?: Resolver<ResolversTypes['RequestAutoApprove'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  numbersApiKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  optOutMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  showContactCell?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  showContactLastName?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  trollbotWebhookUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PageInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['PageInfo'] = ResolversParentTypes['PageInfo']> = {
  limit?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  next?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  offset?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  previous?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PaginatedCampaignsResolvers<ContextType = any, ParentType extends ResolversParentTypes['PaginatedCampaigns'] = ResolversParentTypes['PaginatedCampaigns']> = {
  campaigns?: Resolver<Maybe<Array<Maybe<ResolversTypes['Campaign']>>>, ParentType, ContextType>;
  pageInfo?: Resolver<Maybe<ResolversTypes['PageInfo']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PaginatedConversationsResolvers<ContextType = any, ParentType extends ResolversParentTypes['PaginatedConversations'] = ResolversParentTypes['PaginatedConversations']> = {
  conversations?: Resolver<Array<Maybe<ResolversTypes['Conversation']>>, ParentType, ContextType>;
  pageInfo?: Resolver<Maybe<ResolversTypes['PageInfo']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PaginatedUsersResolvers<ContextType = any, ParentType extends ResolversParentTypes['PaginatedUsers'] = ResolversParentTypes['PaginatedUsers']> = {
  pageInfo?: Resolver<Maybe<ResolversTypes['PageInfo']>, ParentType, ContextType>;
  users?: Resolver<Maybe<Array<Maybe<ResolversTypes['User']>>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface PhoneScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Phone'], any> {
  name: 'Phone';
}

export type QuestionResolvers<ContextType = any, ParentType extends ResolversParentTypes['Question'] = ResolversParentTypes['Question']> = {
  answerOptions?: Resolver<Maybe<Array<Maybe<ResolversTypes['AnswerOption']>>>, ParentType, ContextType>;
  interactionStep?: Resolver<Maybe<ResolversTypes['InteractionStep']>, ParentType, ContextType>;
  text?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QuestionResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['QuestionResponse'] = ResolversParentTypes['QuestionResponse']> = {
  id?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  question?: Resolver<Maybe<ResolversTypes['Question']>, ParentType, ContextType>;
  value?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Register10DlcBrandNoticeResolvers<ContextType = any, ParentType extends ResolversParentTypes['Register10DlcBrandNotice'] = ResolversParentTypes['Register10DlcBrandNotice']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  tcrBrandRegistrationUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type RelayPageInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['RelayPageInfo'] = ResolversParentTypes['RelayPageInfo']> = {
  endCursor?: Resolver<Maybe<ResolversTypes['Cursor']>, ParentType, ContextType>;
  hasNextPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hasPreviousPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  startCursor?: Resolver<Maybe<ResolversTypes['Cursor']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ReleaseAllUnhandledRepliesResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['ReleaseAllUnhandledRepliesResult'] = ResolversParentTypes['ReleaseAllUnhandledRepliesResult']> = {
  campaignCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  contactCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ReturnStringResolvers<ContextType = any, ParentType extends ResolversParentTypes['ReturnString'] = ResolversParentTypes['ReturnString']> = {
  data?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type RootMutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['RootMutation'] = ResolversParentTypes['RootMutation']> = {
  addToken?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<RootMutationAddTokenArgs, 'input' | 'organizationId'>>;
  addUsersToTeam?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<RootMutationAddUsersToTeamArgs, 'teamId' | 'userIds'>>;
  archiveCampaign?: Resolver<Maybe<ResolversTypes['Campaign']>, ParentType, ContextType, RequireFields<RootMutationArchiveCampaignArgs, 'id'>>;
  assignUserToCampaign?: Resolver<Maybe<ResolversTypes['Campaign']>, ParentType, ContextType, RequireFields<RootMutationAssignUserToCampaignArgs, 'campaignId' | 'organizationUuid'>>;
  bulkSendMessages?: Resolver<Maybe<Array<Maybe<ResolversTypes['CampaignContact']>>>, ParentType, ContextType, RequireFields<RootMutationBulkSendMessagesArgs, 'assignmentId'>>;
  bulkUpdateScript?: Resolver<Maybe<Array<Maybe<ResolversTypes['ScriptUpdateResult']>>>, ParentType, ContextType, RequireFields<RootMutationBulkUpdateScriptArgs, 'findAndReplace' | 'organizationId'>>;
  changeUserPassword?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<RootMutationChangeUserPasswordArgs, 'userId'>>;
  copyCampaign?: Resolver<Maybe<ResolversTypes['Campaign']>, ParentType, ContextType, RequireFields<RootMutationCopyCampaignArgs, 'id'>>;
  createCampaign?: Resolver<Maybe<ResolversTypes['Campaign']>, ParentType, ContextType, RequireFields<RootMutationCreateCampaignArgs, 'campaign'>>;
  createCannedResponse?: Resolver<Maybe<ResolversTypes['CannedResponse']>, ParentType, ContextType, RequireFields<RootMutationCreateCannedResponseArgs, 'cannedResponse'>>;
  createExternalSystem?: Resolver<ResolversTypes['ExternalSystem'], ParentType, ContextType, RequireFields<RootMutationCreateExternalSystemArgs, 'externalSystem' | 'organizationId'>>;
  createInvite?: Resolver<Maybe<ResolversTypes['Invite']>, ParentType, ContextType, RequireFields<RootMutationCreateInviteArgs, 'invite'>>;
  createOptOut?: Resolver<Maybe<ResolversTypes['CampaignContact']>, ParentType, ContextType, RequireFields<RootMutationCreateOptOutArgs, 'campaignContactId' | 'optOut'>>;
  createOrganization?: Resolver<Maybe<ResolversTypes['Organization']>, ParentType, ContextType, RequireFields<RootMutationCreateOrganizationArgs, 'inviteId' | 'name' | 'userId'>>;
  createQuestionResponseSyncConfig?: Resolver<ResolversTypes['ExternalSyncQuestionResponseConfig'], ParentType, ContextType, RequireFields<RootMutationCreateQuestionResponseSyncConfigArgs, 'input'>>;
  createQuestionResponseSyncTarget?: Resolver<ResolversTypes['ExternalSyncConfigTarget'], ParentType, ContextType, RequireFields<RootMutationCreateQuestionResponseSyncTargetArgs, 'input'>>;
  deleteCampaignGroup?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<RootMutationDeleteCampaignGroupArgs, 'campaignGroupId' | 'organizationId'>>;
  deleteCampaignOverlap?: Resolver<ResolversTypes['DeleteCampaignOverlapResult'], ParentType, ContextType, RequireFields<RootMutationDeleteCampaignOverlapArgs, 'campaignId' | 'organizationId' | 'overlappingCampaignId'>>;
  deleteJob?: Resolver<Maybe<ResolversTypes['JobRequest']>, ParentType, ContextType, RequireFields<RootMutationDeleteJobArgs, 'campaignId' | 'id'>>;
  deleteLinkDomain?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<RootMutationDeleteLinkDomainArgs, 'domainId' | 'organizationId'>>;
  deleteManyCampaignOverlap?: Resolver<ResolversTypes['Int'], ParentType, ContextType, RequireFields<RootMutationDeleteManyCampaignOverlapArgs, 'campaignId' | 'organizationId' | 'overlappingCampaignIds'>>;
  deleteNeedsMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<RootMutationDeleteNeedsMessageArgs, 'campaignId'>>;
  deleteQuestionResponseSyncConfig?: Resolver<ResolversTypes['ExternalSyncQuestionResponseConfig'], ParentType, ContextType, RequireFields<RootMutationDeleteQuestionResponseSyncConfigArgs, 'input'>>;
  deleteQuestionResponseSyncTarget?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<RootMutationDeleteQuestionResponseSyncTargetArgs, 'targetId'>>;
  deleteQuestionResponses?: Resolver<Maybe<ResolversTypes['CampaignContact']>, ParentType, ContextType, RequireFields<RootMutationDeleteQuestionResponsesArgs, 'campaignContactId'>>;
  deleteTag?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<RootMutationDeleteTagArgs, 'organizationId' | 'tagId'>>;
  deleteTeam?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<RootMutationDeleteTeamArgs, 'organizationId' | 'teamId'>>;
  dismissAlarms?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<RootMutationDismissAlarmsArgs, 'messageIds' | 'organizationId'>>;
  dismissMatchingAlarms?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<RootMutationDismissMatchingAlarmsArgs, 'organizationId' | 'token'>>;
  editCampaign?: Resolver<Maybe<ResolversTypes['Campaign']>, ParentType, ContextType, RequireFields<RootMutationEditCampaignArgs, 'campaign' | 'id'>>;
  editCampaignContactMessageStatus?: Resolver<Maybe<ResolversTypes['CampaignContact']>, ParentType, ContextType, RequireFields<RootMutationEditCampaignContactMessageStatusArgs, 'campaignContactId' | 'messageStatus'>>;
  editExternalOptOutSyncConfig?: Resolver<ResolversTypes['ExternalSystem'], ParentType, ContextType, RequireFields<RootMutationEditExternalOptOutSyncConfigArgs, 'systemId'>>;
  editExternalSystem?: Resolver<ResolversTypes['ExternalSystem'], ParentType, ContextType, RequireFields<RootMutationEditExternalSystemArgs, 'externalSystem' | 'id'>>;
  editOrganization?: Resolver<ResolversTypes['Organization'], ParentType, ContextType, RequireFields<RootMutationEditOrganizationArgs, 'id' | 'input'>>;
  editOrganizationMembership?: Resolver<ResolversTypes['OrganizationMembership'], ParentType, ContextType, RequireFields<RootMutationEditOrganizationMembershipArgs, 'id'>>;
  editOrganizationSettings?: Resolver<ResolversTypes['OrganizationSettings'], ParentType, ContextType, RequireFields<RootMutationEditOrganizationSettingsArgs, 'id' | 'input'>>;
  editUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<RootMutationEditUserArgs, 'organizationId' | 'userId'>>;
  exportCampaign?: Resolver<Maybe<ResolversTypes['JobRequest']>, ParentType, ContextType, RequireFields<RootMutationExportCampaignArgs, 'options'>>;
  filterLandlines?: Resolver<Maybe<ResolversTypes['Campaign']>, ParentType, ContextType, RequireFields<RootMutationFilterLandlinesArgs, 'id'>>;
  findNewCampaignContact?: Resolver<Maybe<ResolversTypes['FoundContact']>, ParentType, ContextType, RequireFields<RootMutationFindNewCampaignContactArgs, 'assignmentId' | 'numberContacts'>>;
  getAssignmentContacts?: Resolver<Maybe<Array<Maybe<ResolversTypes['CampaignContact']>>>, ParentType, ContextType, RequireFields<RootMutationGetAssignmentContactsArgs, 'assignmentId'>>;
  handleConversation?: Resolver<Maybe<ResolversTypes['CampaignContact']>, ParentType, ContextType, RequireFields<RootMutationHandleConversationArgs, 'campaignContactId'>>;
  insertLinkDomain?: Resolver<ResolversTypes['LinkDomain'], ParentType, ContextType, RequireFields<RootMutationInsertLinkDomainArgs, 'domain' | 'maxUsageCount' | 'organizationId'>>;
  joinOrganization?: Resolver<ResolversTypes['Organization'], ParentType, ContextType, RequireFields<RootMutationJoinOrganizationArgs, 'organizationUuid'>>;
  markForSecondPass?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<RootMutationMarkForSecondPassArgs, 'campaignId' | 'input'>>;
  megaBulkReassignCampaignContacts?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<RootMutationMegaBulkReassignCampaignContactsArgs, 'organizationId'>>;
  megaReassignCampaignContacts?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<RootMutationMegaReassignCampaignContactsArgs, 'campaignIdsContactIds' | 'organizationId'>>;
  purgeOrganizationUsers?: Resolver<ResolversTypes['Int'], ParentType, ContextType, RequireFields<RootMutationPurgeOrganizationUsersArgs, 'organizationId'>>;
  refreshExternalSystem?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<RootMutationRefreshExternalSystemArgs, 'externalSystemId'>>;
  releaseAllUnhandledReplies?: Resolver<ResolversTypes['ReleaseAllUnhandledRepliesResult'], ParentType, ContextType, RequireFields<RootMutationReleaseAllUnhandledRepliesArgs, 'organizationId'>>;
  releaseMessages?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<RootMutationReleaseMessagesArgs, 'campaignId' | 'target'>>;
  releaseMyReplies?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<RootMutationReleaseMyRepliesArgs, 'organizationId'>>;
  removeOptOut?: Resolver<Maybe<Array<Maybe<ResolversTypes['CampaignContact']>>>, ParentType, ContextType, RequireFields<RootMutationRemoveOptOutArgs, 'cell'>>;
  removeToken?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<RootMutationRemoveTokenArgs, 'organizationId' | 'token'>>;
  removeUsersFromTeam?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<RootMutationRemoveUsersFromTeamArgs, 'teamId' | 'userIds'>>;
  requestTexts?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<RootMutationRequestTextsArgs, 'count' | 'email' | 'organizationId' | 'preferredTeamId'>>;
  resetUserPassword?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<RootMutationResetUserPasswordArgs, 'organizationId' | 'userId'>>;
  resolveAssignmentRequest?: Resolver<ResolversTypes['Int'], ParentType, ContextType, RequireFields<RootMutationResolveAssignmentRequestArgs, 'approved' | 'assignmentRequestId'>>;
  saveCampaignGroups?: Resolver<Array<ResolversTypes['CampaignGroup']>, ParentType, ContextType, RequireFields<RootMutationSaveCampaignGroupsArgs, 'campaignGroups' | 'organizationId'>>;
  saveTag?: Resolver<ResolversTypes['Tag'], ParentType, ContextType, RequireFields<RootMutationSaveTagArgs, 'organizationId' | 'tag'>>;
  saveTeams?: Resolver<Array<Maybe<ResolversTypes['Team']>>, ParentType, ContextType, RequireFields<RootMutationSaveTeamsArgs, 'organizationId' | 'teams'>>;
  sendMessage?: Resolver<Maybe<ResolversTypes['CampaignContact']>, ParentType, ContextType, RequireFields<RootMutationSendMessageArgs, 'campaignContactId' | 'message'>>;
  sendReply?: Resolver<Maybe<ResolversTypes['CampaignContact']>, ParentType, ContextType, RequireFields<RootMutationSendReplyArgs, 'id' | 'message'>>;
  startCampaign?: Resolver<Maybe<ResolversTypes['Campaign']>, ParentType, ContextType, RequireFields<RootMutationStartCampaignArgs, 'id'>>;
  syncCampaignToSystem?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<RootMutationSyncCampaignToSystemArgs, 'input'>>;
  tagConversation?: Resolver<Maybe<ResolversTypes['CampaignContact']>, ParentType, ContextType, RequireFields<RootMutationTagConversationArgs, 'campaignContactId' | 'tag'>>;
  unMarkForSecondPass?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<RootMutationUnMarkForSecondPassArgs, 'campaignId'>>;
  unarchiveCampaign?: Resolver<Maybe<ResolversTypes['Campaign']>, ParentType, ContextType, RequireFields<RootMutationUnarchiveCampaignArgs, 'id'>>;
  updateLinkDomain?: Resolver<ResolversTypes['LinkDomain'], ParentType, ContextType, RequireFields<RootMutationUpdateLinkDomainArgs, 'domainId' | 'organizationId' | 'payload'>>;
  updateQuestionResponses?: Resolver<Maybe<ResolversTypes['CampaignContact']>, ParentType, ContextType, RequireFields<RootMutationUpdateQuestionResponsesArgs, 'campaignContactId'>>;
  updateTextRequestFormSettings?: Resolver<Maybe<ResolversTypes['Organization']>, ParentType, ContextType, RequireFields<RootMutationUpdateTextRequestFormSettingsArgs, 'organizationId' | 'textRequestFormEnabled' | 'textRequestMaxCount' | 'textRequestType'>>;
  updateTextingHours?: Resolver<Maybe<ResolversTypes['Organization']>, ParentType, ContextType, RequireFields<RootMutationUpdateTextingHoursArgs, 'organizationId' | 'textingHoursEnd' | 'textingHoursStart'>>;
  updateTextingHoursEnforcement?: Resolver<Maybe<ResolversTypes['Organization']>, ParentType, ContextType, RequireFields<RootMutationUpdateTextingHoursEnforcementArgs, 'organizationId' | 'textingHoursEnforced'>>;
  userAgreeTerms?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<RootMutationUserAgreeTermsArgs, 'userId'>>;
};

export type RootQueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['RootQuery'] = ResolversParentTypes['RootQuery']> = {
  assignment?: Resolver<Maybe<ResolversTypes['Assignment']>, ParentType, ContextType, RequireFields<RootQueryAssignmentArgs, 'id'>>;
  assignmentRequests?: Resolver<Maybe<Array<Maybe<ResolversTypes['AssignmentRequest']>>>, ParentType, ContextType, RequireFields<RootQueryAssignmentRequestsArgs, 'organizationId'>>;
  availableActions?: Resolver<Maybe<Array<Maybe<ResolversTypes['Action']>>>, ParentType, ContextType, RequireFields<RootQueryAvailableActionsArgs, 'organizationId'>>;
  campaign?: Resolver<Maybe<ResolversTypes['Campaign']>, ParentType, ContextType, RequireFields<RootQueryCampaignArgs, 'id'>>;
  campaignGroups?: Resolver<ResolversTypes['CampaignGroupPage'], ParentType, ContextType, RequireFields<RootQueryCampaignGroupsArgs, 'organizationId'>>;
  campaigns?: Resolver<Maybe<ResolversTypes['CampaignsReturn']>, ParentType, ContextType, RequireFields<RootQueryCampaignsArgs, 'organizationId'>>;
  contact?: Resolver<Maybe<ResolversTypes['CampaignContact']>, ParentType, ContextType, RequireFields<RootQueryContactArgs, 'id'>>;
  conversations?: Resolver<Maybe<ResolversTypes['PaginatedConversations']>, ParentType, ContextType, RequireFields<RootQueryConversationsArgs, 'cursor' | 'organizationId'>>;
  currentUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  externalLists?: Resolver<ResolversTypes['ExternalListPage'], ParentType, ContextType, RequireFields<RootQueryExternalListsArgs, 'organizationId' | 'systemId'>>;
  externalSystem?: Resolver<ResolversTypes['ExternalSystem'], ParentType, ContextType, RequireFields<RootQueryExternalSystemArgs, 'systemId'>>;
  externalSystems?: Resolver<ResolversTypes['ExternalSystemPage'], ParentType, ContextType, RequireFields<RootQueryExternalSystemsArgs, 'organizationId'>>;
  fetchCampaignOverlaps?: Resolver<Array<Maybe<ResolversTypes['FetchCampaignOverlapResult']>>, ParentType, ContextType, RequireFields<RootQueryFetchCampaignOverlapsArgs, 'input'>>;
  inviteByHash?: Resolver<Maybe<Array<Maybe<ResolversTypes['Invite']>>>, ParentType, ContextType, RequireFields<RootQueryInviteByHashArgs, 'hash'>>;
  notices?: Resolver<ResolversTypes['NoticePage'], ParentType, ContextType, RequireFields<RootQueryNoticesArgs, never>>;
  organization?: Resolver<Maybe<ResolversTypes['Organization']>, ParentType, ContextType, RequireFields<RootQueryOrganizationArgs, 'id'>>;
  organizations?: Resolver<Maybe<Array<Maybe<ResolversTypes['Organization']>>>, ParentType, ContextType>;
  people?: Resolver<Maybe<ResolversTypes['UsersReturn']>, ParentType, ContextType, RequireFields<RootQueryPeopleArgs, 'organizationId'>>;
  peopleByUserIds?: Resolver<Maybe<ResolversTypes['UsersList']>, ParentType, ContextType, RequireFields<RootQueryPeopleByUserIdsArgs, 'organizationId'>>;
  team?: Resolver<ResolversTypes['Team'], ParentType, ContextType, RequireFields<RootQueryTeamArgs, 'id'>>;
  trollAlarms?: Resolver<ResolversTypes['TrollAlarmPage'], ParentType, ContextType, RequireFields<RootQueryTrollAlarmsArgs, 'dismissed' | 'limit' | 'offset' | 'organizationId'>>;
  trollAlarmsCount?: Resolver<ResolversTypes['TrollAlarmCount'], ParentType, ContextType, RequireFields<RootQueryTrollAlarmsCountArgs, 'dismissed' | 'organizationId'>>;
  trollTokens?: Resolver<Maybe<Array<Maybe<ResolversTypes['TrollTrigger']>>>, ParentType, ContextType, RequireFields<RootQueryTrollTokensArgs, 'organizationId'>>;
};

export type ScriptUpdateResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['ScriptUpdateResult'] = ResolversParentTypes['ScriptUpdateResult']> = {
  campaignId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  found?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  replaced?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TagResolvers<ContextType = any, ParentType extends ResolversParentTypes['Tag'] = ResolversParentTypes['Tag']> = {
  author?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  backgroundColor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  confirmationSteps?: Resolver<Array<Maybe<Array<Maybe<ResolversTypes['String']>>>>, ParentType, ContextType>;
  contacts?: Resolver<Array<Maybe<ResolversTypes['CampaignContact']>>, ParentType, ContextType, RequireFields<TagContactsArgs, never>>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  externalSyncConfigurations?: Resolver<ResolversTypes['ExternalSyncTagConfigPage'], ParentType, ContextType, RequireFields<TagExternalSyncConfigurationsArgs, never>>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isAssignable?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isSystem?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  onApplyScript?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  textColor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  webhookUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TeamResolvers<ContextType = any, ParentType extends ResolversParentTypes['Team'] = ResolversParentTypes['Team']> = {
  assignmentPriority?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  assignmentType?: Resolver<Maybe<ResolversTypes['TextRequestType']>, ParentType, ContextType>;
  author?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  backgroundColor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  campaigns?: Resolver<Array<Maybe<ResolversTypes['Campaign']>>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  escalationTags?: Resolver<Maybe<Array<Maybe<ResolversTypes['Tag']>>>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isAssignmentEnabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  maxRequestCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  textColor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  users?: Resolver<Array<Maybe<ResolversTypes['User']>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TrollAlarmResolvers<ContextType = any, ParentType extends ResolversParentTypes['TrollAlarm'] = ResolversParentTypes['TrollAlarm']> = {
  contact?: Resolver<ResolversTypes['CampaignContact'], ParentType, ContextType>;
  dismissed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  messageId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  messageText?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  token?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TrollAlarmCountResolvers<ContextType = any, ParentType extends ResolversParentTypes['TrollAlarmCount'] = ResolversParentTypes['TrollAlarmCount']> = {
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TrollAlarmPageResolvers<ContextType = any, ParentType extends ResolversParentTypes['TrollAlarmPage'] = ResolversParentTypes['TrollAlarmPage']> = {
  alarms?: Resolver<Array<ResolversTypes['TrollAlarm']>, ParentType, ContextType>;
  totalCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TrollTriggerResolvers<ContextType = any, ParentType extends ResolversParentTypes['TrollTrigger'] = ResolversParentTypes['TrollTrigger']> = {
  compiledTsQuery?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  mode?: Resolver<ResolversTypes['TrollTriggerMode'], ParentType, ContextType>;
  organizationId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  token?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UnhealthyLinkDomainResolvers<ContextType = any, ParentType extends ResolversParentTypes['UnhealthyLinkDomain'] = ResolversParentTypes['UnhealthyLinkDomain']> = {
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  domain?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  healthyAgainAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface UploadScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Upload'], any> {
  name: 'Upload';
}

export type UserResolvers<ContextType = any, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = {
  assignedCell?: Resolver<Maybe<ResolversTypes['Phone']>, ParentType, ContextType>;
  assignment?: Resolver<Maybe<ResolversTypes['Assignment']>, ParentType, ContextType, RequireFields<UserAssignmentArgs, never>>;
  cell?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  currentRequest?: Resolver<Maybe<ResolversTypes['AssignmentRequest']>, ParentType, ContextType, RequireFields<UserCurrentRequestArgs, 'organizationId'>>;
  displayName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  email?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  firstName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  isSuperadmin?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  lastName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  memberships?: Resolver<Maybe<ResolversTypes['OrganizationMembershipPage']>, ParentType, ContextType, RequireFields<UserMembershipsArgs, never>>;
  organizations?: Resolver<Maybe<Array<Maybe<ResolversTypes['Organization']>>>, ParentType, ContextType, RequireFields<UserOrganizationsArgs, never>>;
  roles?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType, RequireFields<UserRolesArgs, 'organizationId'>>;
  teams?: Resolver<Array<Maybe<ResolversTypes['Team']>>, ParentType, ContextType, RequireFields<UserTeamsArgs, 'organizationId'>>;
  terms?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  todos?: Resolver<Maybe<Array<Maybe<ResolversTypes['Assignment']>>>, ParentType, ContextType, RequireFields<UserTodosArgs, never>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UsersListResolvers<ContextType = any, ParentType extends ResolversParentTypes['UsersList'] = ResolversParentTypes['UsersList']> = {
  users?: Resolver<Maybe<Array<Maybe<ResolversTypes['User']>>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UsersReturnResolvers<ContextType = any, ParentType extends ResolversParentTypes['UsersReturn'] = ResolversParentTypes['UsersReturn']> = {
  __resolveType: TypeResolveFn<'PaginatedUsers' | 'UsersList', ParentType, ContextType>;
};

export type Resolvers<ContextType = any> = {
  Action?: ActionResolvers<ContextType>;
  AnswerOption?: AnswerOptionResolvers<ContextType>;
  Assignment?: AssignmentResolvers<ContextType>;
  AssignmentRequest?: AssignmentRequestResolvers<ContextType>;
  AssignmentTarget?: AssignmentTargetResolvers<ContextType>;
  Campaign?: CampaignResolvers<ContextType>;
  CampaignContact?: CampaignContactResolvers<ContextType>;
  CampaignDeliverabilityStats?: CampaignDeliverabilityStatsResolvers<ContextType>;
  CampaignEdge?: CampaignEdgeResolvers<ContextType>;
  CampaignGroup?: CampaignGroupResolvers<ContextType>;
  CampaignGroupEdge?: CampaignGroupEdgeResolvers<ContextType>;
  CampaignGroupPage?: CampaignGroupPageResolvers<ContextType>;
  CampaignPage?: CampaignPageResolvers<ContextType>;
  CampaignReadiness?: CampaignReadinessResolvers<ContextType>;
  CampaignStats?: CampaignStatsResolvers<ContextType>;
  CampaignsList?: CampaignsListResolvers<ContextType>;
  CampaignsReturn?: CampaignsReturnResolvers<ContextType>;
  CannedResponse?: CannedResponseResolvers<ContextType>;
  Conversation?: ConversationResolvers<ContextType>;
  Cursor?: GraphQLScalarType;
  Date?: GraphQLScalarType;
  DeleteCampaignOverlapResult?: DeleteCampaignOverlapResultResolvers<ContextType>;
  DeliverabilityErrorStat?: DeliverabilityErrorStatResolvers<ContextType>;
  ExternalActivistCode?: ExternalActivistCodeResolvers<ContextType>;
  ExternalActivistCodeEdge?: ExternalActivistCodeEdgeResolvers<ContextType>;
  ExternalActivistCodePage?: ExternalActivistCodePageResolvers<ContextType>;
  ExternalActivistCodeTarget?: ExternalActivistCodeTargetResolvers<ContextType>;
  ExternalList?: ExternalListResolvers<ContextType>;
  ExternalListEdge?: ExternalListEdgeResolvers<ContextType>;
  ExternalListPage?: ExternalListPageResolvers<ContextType>;
  ExternalResultCode?: ExternalResultCodeResolvers<ContextType>;
  ExternalResultCodeEdge?: ExternalResultCodeEdgeResolvers<ContextType>;
  ExternalResultCodePage?: ExternalResultCodePageResolvers<ContextType>;
  ExternalResultCodeTarget?: ExternalResultCodeTargetResolvers<ContextType>;
  ExternalSurveyQuestion?: ExternalSurveyQuestionResolvers<ContextType>;
  ExternalSurveyQuestionEdge?: ExternalSurveyQuestionEdgeResolvers<ContextType>;
  ExternalSurveyQuestionPage?: ExternalSurveyQuestionPageResolvers<ContextType>;
  ExternalSurveyQuestionResponseOption?: ExternalSurveyQuestionResponseOptionResolvers<ContextType>;
  ExternalSurveyQuestionResponseOptionEdge?: ExternalSurveyQuestionResponseOptionEdgeResolvers<ContextType>;
  ExternalSurveyQuestionResponseOptionPage?: ExternalSurveyQuestionResponseOptionPageResolvers<ContextType>;
  ExternalSurveyQuestionResponseOptionTarget?: ExternalSurveyQuestionResponseOptionTargetResolvers<ContextType>;
  ExternalSyncConfigTarget?: ExternalSyncConfigTargetResolvers<ContextType>;
  ExternalSyncConfigTargetEdge?: ExternalSyncConfigTargetEdgeResolvers<ContextType>;
  ExternalSyncConfigTargetPage?: ExternalSyncConfigTargetPageResolvers<ContextType>;
  ExternalSyncQuestionResponseConfig?: ExternalSyncQuestionResponseConfigResolvers<ContextType>;
  ExternalSyncQuestionResponseConfigEdge?: ExternalSyncQuestionResponseConfigEdgeResolvers<ContextType>;
  ExternalSyncQuestionResponseConfigPage?: ExternalSyncQuestionResponseConfigPageResolvers<ContextType>;
  ExternalSyncTagConfig?: ExternalSyncTagConfigResolvers<ContextType>;
  ExternalSyncTagConfigEdge?: ExternalSyncTagConfigEdgeResolvers<ContextType>;
  ExternalSyncTagConfigPage?: ExternalSyncTagConfigPageResolvers<ContextType>;
  ExternalSystem?: ExternalSystemResolvers<ContextType>;
  ExternalSystemEdge?: ExternalSystemEdgeResolvers<ContextType>;
  ExternalSystemPage?: ExternalSystemPageResolvers<ContextType>;
  FetchCampaignOverlapResult?: FetchCampaignOverlapResultResolvers<ContextType>;
  FoundContact?: FoundContactResolvers<ContextType>;
  InteractionStep?: InteractionStepResolvers<ContextType>;
  Invite?: InviteResolvers<ContextType>;
  JSON?: GraphQLScalarType;
  JobRequest?: JobRequestResolvers<ContextType>;
  LinkDomain?: LinkDomainResolvers<ContextType>;
  Location?: LocationResolvers<ContextType>;
  Message?: MessageResolvers<ContextType>;
  MessagingService?: MessagingServiceResolvers<ContextType>;
  MessagingServiceEdge?: MessagingServiceEdgeResolvers<ContextType>;
  MessagingServicePage?: MessagingServicePageResolvers<ContextType>;
  Notice?: NoticeResolvers<ContextType>;
  NoticeEdge?: NoticeEdgeResolvers<ContextType>;
  NoticePage?: NoticePageResolvers<ContextType>;
  OptOut?: OptOutResolvers<ContextType>;
  Organization?: OrganizationResolvers<ContextType>;
  OrganizationMembership?: OrganizationMembershipResolvers<ContextType>;
  OrganizationMembershipEdge?: OrganizationMembershipEdgeResolvers<ContextType>;
  OrganizationMembershipPage?: OrganizationMembershipPageResolvers<ContextType>;
  OrganizationSettings?: OrganizationSettingsResolvers<ContextType>;
  PageInfo?: PageInfoResolvers<ContextType>;
  PaginatedCampaigns?: PaginatedCampaignsResolvers<ContextType>;
  PaginatedConversations?: PaginatedConversationsResolvers<ContextType>;
  PaginatedUsers?: PaginatedUsersResolvers<ContextType>;
  Phone?: GraphQLScalarType;
  Question?: QuestionResolvers<ContextType>;
  QuestionResponse?: QuestionResponseResolvers<ContextType>;
  Register10DlcBrandNotice?: Register10DlcBrandNoticeResolvers<ContextType>;
  RelayPageInfo?: RelayPageInfoResolvers<ContextType>;
  ReleaseAllUnhandledRepliesResult?: ReleaseAllUnhandledRepliesResultResolvers<ContextType>;
  ReturnString?: ReturnStringResolvers<ContextType>;
  RootMutation?: RootMutationResolvers<ContextType>;
  RootQuery?: RootQueryResolvers<ContextType>;
  ScriptUpdateResult?: ScriptUpdateResultResolvers<ContextType>;
  Tag?: TagResolvers<ContextType>;
  Team?: TeamResolvers<ContextType>;
  TrollAlarm?: TrollAlarmResolvers<ContextType>;
  TrollAlarmCount?: TrollAlarmCountResolvers<ContextType>;
  TrollAlarmPage?: TrollAlarmPageResolvers<ContextType>;
  TrollTrigger?: TrollTriggerResolvers<ContextType>;
  UnhealthyLinkDomain?: UnhealthyLinkDomainResolvers<ContextType>;
  Upload?: GraphQLScalarType;
  User?: UserResolvers<ContextType>;
  UsersList?: UsersListResolvers<ContextType>;
  UsersReturn?: UsersReturnResolvers<ContextType>;
};


export type GetCurrentUserIdQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCurrentUserIdQuery = { __typename?: 'RootQuery', currentUser?: { __typename?: 'User', id?: string | null | undefined } | null | undefined };

export type CurrentUserOrganizationRolesQueryVariables = Exact<{
  organizationId: Scalars['String'];
}>;


export type CurrentUserOrganizationRolesQuery = { __typename?: 'RootQuery', currentUser?: { __typename?: 'User', id?: string | null | undefined, isSuperadmin: boolean, roles: Array<string> } | null | undefined };

export type GetOrganizationSettingsQueryVariables = Exact<{
  organizationId: Scalars['String'];
}>;


export type GetOrganizationSettingsQuery = { __typename?: 'RootQuery', organization?: { __typename?: 'Organization', id?: string | null | undefined, settings: { __typename?: 'OrganizationSettings', id: string, showContactLastName?: boolean | null | undefined, showContactCell?: boolean | null | undefined, confirmationClickForScriptLinks: boolean } } | null | undefined };

export type TexterOrganizationSettingsFragmentFragment = { __typename?: 'OrganizationSettings', id: string, showContactLastName?: boolean | null | undefined, showContactCell?: boolean | null | undefined, confirmationClickForScriptLinks: boolean };

export const TexterOrganizationSettingsFragmentFragmentDoc = gql`
    fragment TexterOrganizationSettingsFragment on OrganizationSettings {
  id
  showContactLastName
  showContactCell
  confirmationClickForScriptLinks
}
    `;
export const GetCurrentUserIdDocument = gql`
    query GetCurrentUserId {
  currentUser {
    id
  }
}
    `;

/**
 * __useGetCurrentUserIdQuery__
 *
 * To run a query within a React component, call `useGetCurrentUserIdQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetCurrentUserIdQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetCurrentUserIdQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetCurrentUserIdQuery(baseOptions?: Apollo.QueryHookOptions<GetCurrentUserIdQuery, GetCurrentUserIdQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetCurrentUserIdQuery, GetCurrentUserIdQueryVariables>(GetCurrentUserIdDocument, options);
      }
export function useGetCurrentUserIdLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetCurrentUserIdQuery, GetCurrentUserIdQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetCurrentUserIdQuery, GetCurrentUserIdQueryVariables>(GetCurrentUserIdDocument, options);
        }
export type GetCurrentUserIdQueryHookResult = ReturnType<typeof useGetCurrentUserIdQuery>;
export type GetCurrentUserIdLazyQueryHookResult = ReturnType<typeof useGetCurrentUserIdLazyQuery>;
export type GetCurrentUserIdQueryResult = Apollo.QueryResult<GetCurrentUserIdQuery, GetCurrentUserIdQueryVariables>;
export const CurrentUserOrganizationRolesDocument = gql`
    query CurrentUserOrganizationRoles($organizationId: String!) {
  currentUser {
    id
    isSuperadmin
    roles(organizationId: $organizationId)
  }
}
    `;

/**
 * __useCurrentUserOrganizationRolesQuery__
 *
 * To run a query within a React component, call `useCurrentUserOrganizationRolesQuery` and pass it any options that fit your needs.
 * When your component renders, `useCurrentUserOrganizationRolesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCurrentUserOrganizationRolesQuery({
 *   variables: {
 *      organizationId: // value for 'organizationId'
 *   },
 * });
 */
export function useCurrentUserOrganizationRolesQuery(baseOptions: Apollo.QueryHookOptions<CurrentUserOrganizationRolesQuery, CurrentUserOrganizationRolesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<CurrentUserOrganizationRolesQuery, CurrentUserOrganizationRolesQueryVariables>(CurrentUserOrganizationRolesDocument, options);
      }
export function useCurrentUserOrganizationRolesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<CurrentUserOrganizationRolesQuery, CurrentUserOrganizationRolesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<CurrentUserOrganizationRolesQuery, CurrentUserOrganizationRolesQueryVariables>(CurrentUserOrganizationRolesDocument, options);
        }
export type CurrentUserOrganizationRolesQueryHookResult = ReturnType<typeof useCurrentUserOrganizationRolesQuery>;
export type CurrentUserOrganizationRolesLazyQueryHookResult = ReturnType<typeof useCurrentUserOrganizationRolesLazyQuery>;
export type CurrentUserOrganizationRolesQueryResult = Apollo.QueryResult<CurrentUserOrganizationRolesQuery, CurrentUserOrganizationRolesQueryVariables>;
export const GetOrganizationSettingsDocument = gql`
    query GetOrganizationSettings($organizationId: String!) {
  organization(id: $organizationId) {
    id
    settings {
      ...TexterOrganizationSettingsFragment
    }
  }
}
    ${TexterOrganizationSettingsFragmentFragmentDoc}`;

/**
 * __useGetOrganizationSettingsQuery__
 *
 * To run a query within a React component, call `useGetOrganizationSettingsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetOrganizationSettingsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetOrganizationSettingsQuery({
 *   variables: {
 *      organizationId: // value for 'organizationId'
 *   },
 * });
 */
export function useGetOrganizationSettingsQuery(baseOptions: Apollo.QueryHookOptions<GetOrganizationSettingsQuery, GetOrganizationSettingsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetOrganizationSettingsQuery, GetOrganizationSettingsQueryVariables>(GetOrganizationSettingsDocument, options);
      }
export function useGetOrganizationSettingsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetOrganizationSettingsQuery, GetOrganizationSettingsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetOrganizationSettingsQuery, GetOrganizationSettingsQueryVariables>(GetOrganizationSettingsDocument, options);
        }
export type GetOrganizationSettingsQueryHookResult = ReturnType<typeof useGetOrganizationSettingsQuery>;
export type GetOrganizationSettingsLazyQueryHookResult = ReturnType<typeof useGetOrganizationSettingsLazyQuery>;
export type GetOrganizationSettingsQueryResult = Apollo.QueryResult<GetOrganizationSettingsQuery, GetOrganizationSettingsQueryVariables>;