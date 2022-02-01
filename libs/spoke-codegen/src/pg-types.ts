export enum MessagingServiceType {
  'Twilio' = 'twilio',
  'AssembleNumbers' = 'assemble-numbers' 
}

export enum TexterStatus {
  'DoNotApprove' = 'do_not_approve',
  'ApprovalRequired' = 'approval_required',
  'AutoApprove' = 'auto_approve' 
}

export interface AllExternalSyncQuestionResponseConfiguration { 
  id: string
  campaignId: number
  interactionStepId: number
  questionResponseValue: string
  createdAt: Date
  updatedAt: Date
  systemId?: string | null 
}

export interface AllQuestionResponse { 
  id: number
  campaignContactId: number
  interactionStepId: number
  value: string
  createdAt: Date
  isDeleted?: boolean | null
  updatedAt?: Date | null 
}

export interface AllTag { 
  id: number
  organizationId: number
  title: string
  description: string
  textColor: string
  backgroundColor: string
  authorId?: number | null
  confirmationSteps: string[]
  onApplyScript: string
  webhookUrl: string
  isAssignable: boolean
  isSystem: boolean
  createdAt: Date
  updatedAt?: Date | null
  deletedAt?: Date | null 
}

export interface AssignableCampaignContacts { 
  id?: number | null
  campaignId?: number | null
  messageStatus?: string | null
  textingHoursEnd?: number | null
  contactTimezone?: string | null 
}

export interface AssignableCampaignContactsWithEscalationTags { 
  id?: number | null
  campaignId?: number | null
  messageStatus?: string | null
  contactTimezone?: string | null
  appliedEscalationTags?: number[] | null 
}

export interface AssignableCampaigns { 
  id?: number | null
  title?: string | null
  organizationId?: number | null
  limitAssignmentToTeams?: boolean | null 
}

export interface AssignableCampaignsWithNeedsMessage { 
  id?: number | null
  title?: string | null
  organizationId?: number | null
  limitAssignmentToTeams?: boolean | null 
}

export interface AssignableCampaignsWithNeedsReply { 
  id?: number | null
  title?: string | null
  organizationId?: number | null
  limitAssignmentToTeams?: boolean | null 
}

export interface AssignableNeedsMessage { 
  id?: number | null
  campaignId?: number | null
  messageStatus?: string | null 
}

export interface AssignableNeedsReply { 
  id?: number | null
  campaignId?: number | null
  messageStatus?: string | null 
}

export interface AssignableNeedsReplyWithEscalationTags { 
  id?: number | null
  campaignId?: number | null
  messageStatus?: string | null
  appliedEscalationTags?: number[] | null 
}

export interface Assignment { 
  id: number
  userId: number
  campaignId: number
  createdAt: Date
  maxContacts?: number | null
  updatedAt?: Date | null 
}

export interface AssignmentRequest { 
  id: number
  createdAt: Date
  updatedAt: Date
  organizationId?: number | null
  status?: string | null
  userId: number
  amount: number
  approvedByUserId?: number | null
  preferredTeamId?: number | null 
}

export interface Campaign { 
  id: number
  organizationId: number
  title: string
  description: string
  isStarted?: boolean | null
  dueBy?: Date | null
  createdAt: Date
  isArchived?: boolean | null
  useDynamicAssignment?: boolean | null
  logoImageUrl?: string | null
  introHtml?: string | null
  primaryColor?: string | null
  textingHoursStart?: number | null
  textingHoursEnd?: number | null
  timezone?: string | null
  creatorId?: number | null
  isAutoassignEnabled: boolean
  limitAssignmentToTeams: boolean
  updatedAt?: Date | null
  repliesStaleAfterMinutes?: number | null
  landlinesFiltered?: boolean | null
  externalSystemId?: string | null
  isApproved?: boolean | null 
}

export interface CampaignContact { 
  id: number
  campaignId: number
  assignmentId?: number | null
  externalId: string
  firstName: string
  lastName: string
  cell: string
  zip: string
  customFields: string
  createdAt: Date
  updatedAt: Date
  messageStatus: string
  isOptedOut?: boolean | null
  timezone?: string | null
  archived?: boolean | null 
}

export interface CampaignContactTag { 
  campaignContactId: number
  tagId: number
  taggerId: number
  createdAt: Date
  updatedAt?: Date | null 
}

export interface CampaignGroup { 
  id: number
  organizationId: number
  name: string
  description: string
  createdAt: Date
  updatedAt: Date 
}

export interface CampaignGroupCampaign { 
  id: number
  campaignGroupId: number
  campaignId: number
  createdAt: Date
  updatedAt: Date 
}

export interface CampaignTeam { 
  campaignId?: number | null
  teamId?: number | null
  createdAt: Date
  updatedAt?: Date | null
  id: number 
}

export interface CampaignWithGroups { 
  id?: number | null
  organizationId?: number | null
  title?: string | null
  description?: string | null
  isStarted?: boolean | null
  dueBy?: Date | null
  createdAt?: Date | null
  isArchived?: boolean | null
  useDynamicAssignment?: boolean | null
  logoImageUrl?: string | null
  introHtml?: string | null
  primaryColor?: string | null
  textingHoursStart?: number | null
  textingHoursEnd?: number | null
  timezone?: string | null
  creatorId?: number | null
  isAutoassignEnabled?: boolean | null
  limitAssignmentToTeams?: boolean | null
  updatedAt?: Date | null
  repliesStaleAfterMinutes?: number | null
  landlinesFiltered?: boolean | null
  externalSystemId?: string | null
  groupName?: string | null
  groupDescription?: string | null 
}

export interface CannedResponse { 
  id: number
  campaignId: number
  text: string
  title: string
  userId?: number | null
  createdAt: Date
  updatedAt?: Date | null 
}

export interface DeliverabilityReport { 
  id: number
  periodStartsAt?: Date | null
  periodEndsAt?: Date | null
  computedAt?: Date | null
  countTotal?: number | null
  countDelivered?: number | null
  countSent?: number | null
  countError?: number | null
  domain?: string | null
  urlPath?: string | null 
}

export interface ExternalActivistCode { 
  id: string
  systemId: string
  externalId: number
  type?: string | null
  name?: string | null
  mediumName?: string | null
  shortName?: string | null
  description?: string | null
  scriptQuestion?: string | null
  status?: string | null
  createdAt: Date
  updatedAt: Date 
}

export interface ExternalList { 
  systemId: string
  externalId: number
  name: string
  description: string
  listCount: number
  doorCount: number
  createdAt: Date
  updatedAt: Date 
}

export interface ExternalResultCode { 
  id: string
  systemId: string
  externalId: number
  name?: string | null
  mediumName?: string | null
  shortName?: string | null
  createdAt: Date
  updatedAt: Date 
}

export interface ExternalSurveyQuestion { 
  id: string
  systemId: string
  externalId: number
  type?: string | null
  cycle?: number | null
  name?: string | null
  mediumName?: string | null
  shortName?: string | null
  scriptQuestion?: string | null
  status?: string | null
  createdAt: Date
  updatedAt: Date 
}

export interface ExternalSurveyQuestionResponseOption { 
  id: string
  externalSurveyQuestionId: string
  externalId: number
  name?: string | null
  mediumName?: string | null
  shortName?: string | null
  createdAt: Date
  updatedAt: Date 
}

export interface ExternalSyncConfigQuestionResponseActivistCode { 
  id: string
  questionResponseConfigId: string
  externalActivistCodeId: string 
}

export interface ExternalSyncConfigQuestionResponseResponseOption { 
  id: string
  questionResponseConfigId: string
  externalResponseOptionId: string 
}

export interface ExternalSyncConfigQuestionResponseResultCode { 
  id: string
  questionResponseConfigId: string
  externalResultCodeId: string 
}

export interface ExternalSyncOptOutConfiguration { 
  id: string
  systemId: string
  externalResultCodeId: string
  createdAt: Date
  updatedAt: Date 
}

export interface ExternalSyncQuestionResponseConfiguration { 
  compoundId?: string | null
  campaignId?: number | null
  systemId?: string | null
  interactionStepId?: number | null
  questionResponseValue?: string | null
  createdAt?: Date | null
  updatedAt?: Date | null
  isEmpty?: boolean | null
  includesNotActive?: boolean | null
  isMissing?: boolean | null
  isRequired?: boolean | null 
}

export interface ExternalSystem { 
  id: string
  name: string
  type: string
  apiKeyRef: string
  organizationId?: number | null
  username: string
  createdAt: Date
  updatedAt: Date
  syncedAt?: Date | null 
}

export interface InstanceSetting { 
  name: string
  type?: string | null
  value: string 
}

export interface InteractionStep { 
  id: number
  campaignId: number
  question: string
  createdAt: Date
  parentInteractionId?: number | null
  answerOption: string
  answerActions: string
  isDeleted: boolean
  scriptOptions: string[]
  updatedAt?: Date | null 
}

export interface Invite { 
  id: number
  isValid: boolean
  hash?: string | null
  createdAt: Date
  updatedAt?: Date | null
  payload: unknown 
}

export interface JobRequest { 
  id: number
  campaignId: number
  payload: string
  queueName: string
  jobType: string
  resultMessage?: string | null
  locksQueue?: boolean | null
  assigned?: boolean | null
  status?: number | null
  updatedAt: Date
  createdAt: Date 
}

export interface KnexMigrations { 
  id: number
  name?: string | null
  batch?: number | null
  migrationTime?: Date | null 
}

export interface KnexMigrationsLock { 
  index: number
  isLocked?: number | null 
}

export interface LinkDomain { 
  id: number
  organizationId: number
  domain: string
  maxUsageCount: number
  currentUsageCount: number
  isManuallyDisabled: boolean
  cycledOutAt: Date
  createdAt: Date
  updatedAt?: Date | null 
}

export interface Log { 
  id: number
  messageSid: string
  body?: string | null
  createdAt: Date
  updatedAt?: Date | null
  serviceType?: MessagingServiceType | null 
}

export interface Message { 
  id: number
  userNumber: string
  userId?: number | null
  contactNumber: string
  isFromContact: boolean
  text: string
  serviceResponse?: string | null
  assignmentId: number
  service: string
  serviceId: string
  sendStatus: string
  createdAt: Date
  queuedAt: Date
  sentAt: Date
  serviceResponseAt: Date
  sendBefore: Date
  campaignContactId?: number | null
  updatedAt?: Date | null
  scriptVersionHash?: string | null
  numSegments?: number | null
  numMedia?: number | null
  errorCodes?: string[] | null 
}

export interface MessagingService { 
  messagingServiceSid: string
  organizationId?: number | null
  accountSid: string
  encryptedAuthToken: string
  updatedAt?: Date | null
  serviceType: MessagingServiceType 
}

export interface MessagingServiceStick { 
  cell: string
  organizationId: number
  messagingServiceSid: string
  updatedAt?: Date | null 
}

export interface MissingExternalSyncQuestionResponseConfiguration { 
  campaignId?: number | null
  interactionStepId?: number | null
  value?: string | null
  isRequired?: boolean | null
  systemId?: string | null 
}

export interface MonthlyOrganizationMessageUsages { 
  month: Date
  organizationId: number
  sentMessageCount?: number | null 
}

export interface OptOut { 
  id: number
  cell: string
  assignmentId: number
  organizationId: number
  reasonCode: string
  createdAt: Date
  updatedAt?: Date | null 
}

export interface Organization { 
  id: number
  uuid?: string | null
  name: string
  createdAt: Date
  features?: string | null
  textingHoursEnforced?: boolean | null
  textingHoursStart?: number | null
  textingHoursEnd?: number | null
  updatedAt?: Date | null
  monthlyMessageLimit?: number | null 
}

export interface PasswordResetRequest { 
  id: number
  email?: string | null
  token?: string | null
  usedAt?: Date | null
  createdAt?: Date | null
  updatedAt?: Date | null
  expiresAt?: Date | null 
}

export interface PendingMessagePart { 
  id: number
  service: string
  serviceId: string
  parentId?: string | null
  serviceMessage: string
  userNumber: string
  contactNumber: string
  createdAt: Date 
}

export interface QuestionResponse { 
  id?: number | null
  campaignContactId?: number | null
  interactionStepId?: number | null
  value?: string | null
  createdAt?: Date | null
  isDeleted?: boolean | null
  updatedAt?: Date | null 
}

export interface Tag { 
  id?: number | null
  organizationId?: number | null
  title?: string | null
  description?: string | null
  textColor?: string | null
  backgroundColor?: string | null
  authorId?: number | null
  confirmationSteps?: string[] | null
  onApplyScript?: string | null
  webhookUrl?: string | null
  isAssignable?: boolean | null
  isSystem?: boolean | null
  createdAt?: Date | null
  updatedAt?: Date | null
  deletedAt?: Date | null 
}

export interface Team { 
  id: number
  organizationId: number
  title: string
  description: string
  textColor: string
  backgroundColor: string
  assignmentPriority?: number | null
  authorId?: number | null
  createdAt: Date
  isAssignmentEnabled?: boolean | null
  assignmentType?: string | null
  maxRequestCount?: number | null
  updatedAt?: Date | null 
}

export interface TeamEscalationTags { 
  teamId?: number | null
  tagId?: number | null
  createdAt?: Date | null
  updatedAt?: Date | null
  id: number 
}

export interface TrollAlarm { 
  messageId: number
  triggerToken: string
  dismissed?: boolean | null
  organizationId: number 
}

export interface TrollTrigger { 
  token: string
  organizationId: number
  mode: string
  compiledTsquery?: any | null 
}

export interface UnhealthyLinkDomain { 
  id: number
  domain: string
  createdAt: Date
  healthyAgainAt?: Date | null
  updatedAt?: Date | null 
}

export interface UnsolicitedMessage { 
  id: number
  messagingServiceSid: string
  serviceId: string
  fromNumber: string
  body: string
  numSegments: number
  numMedia: number
  mediaUrls: string[]
  serviceResponse: unknown
  createdAt: Date
  updatedAt: Date 
}

export interface User { 
  id: number
  auth0Id: string
  firstName: string
  lastName: string
  cell: string
  email: string
  createdAt: Date
  assignedCell?: string | null
  isSuperadmin?: boolean | null
  terms?: boolean | null
  updatedAt?: Date | null 
}

export interface UserCell { 
  id: number
  cell: string
  userId: number
  service?: string | null
  isPrimary?: boolean | null 
}

export interface UserOrganization { 
  id: number
  userId: number
  organizationId: number
  role: string
  updatedAt?: Date | null
  requestStatus: TexterStatus 
}

export interface UserTeam { 
  userId?: number | null
  teamId?: number | null
  createdAt: Date
  updatedAt?: Date | null
  id: number 
}

export interface VTrollTrigger { 
  toTsquery?: any | null 
}

export interface ZipCode { 
  zip: string
  city: string
  state: string
  latitude: number
  longitude: number
  timezoneOffset: number
  hasDst: boolean 
}

export interface Tables {
  all_external_sync_question_response_configuration: AllExternalSyncQuestionResponseConfiguration,
  all_question_response: AllQuestionResponse,
  all_tag: AllTag,
  assignable_campaign_contacts: AssignableCampaignContacts,
  assignable_campaign_contacts_with_escalation_tags: AssignableCampaignContactsWithEscalationTags,
  assignable_campaigns: AssignableCampaigns,
  assignable_campaigns_with_needs_message: AssignableCampaignsWithNeedsMessage,
  assignable_campaigns_with_needs_reply: AssignableCampaignsWithNeedsReply,
  assignable_needs_message: AssignableNeedsMessage,
  assignable_needs_reply: AssignableNeedsReply,
  assignable_needs_reply_with_escalation_tags: AssignableNeedsReplyWithEscalationTags,
  assignment: Assignment,
  assignment_request: AssignmentRequest,
  campaign: Campaign,
  campaign_contact: CampaignContact,
  campaign_contact_tag: CampaignContactTag,
  campaign_group: CampaignGroup,
  campaign_group_campaign: CampaignGroupCampaign,
  campaign_team: CampaignTeam,
  campaign_with_groups: CampaignWithGroups,
  canned_response: CannedResponse,
  deliverability_report: DeliverabilityReport,
  external_activist_code: ExternalActivistCode,
  external_list: ExternalList,
  external_result_code: ExternalResultCode,
  external_survey_question: ExternalSurveyQuestion,
  external_survey_question_response_option: ExternalSurveyQuestionResponseOption,
  external_sync_config_question_response_activist_code: ExternalSyncConfigQuestionResponseActivistCode,
  external_sync_config_question_response_response_option: ExternalSyncConfigQuestionResponseResponseOption,
  external_sync_config_question_response_result_code: ExternalSyncConfigQuestionResponseResultCode,
  external_sync_opt_out_configuration: ExternalSyncOptOutConfiguration,
  external_sync_question_response_configuration: ExternalSyncQuestionResponseConfiguration,
  external_system: ExternalSystem,
  instance_setting: InstanceSetting,
  interaction_step: InteractionStep,
  invite: Invite,
  job_request: JobRequest,
  knex_migrations: KnexMigrations,
  knex_migrations_lock: KnexMigrationsLock,
  link_domain: LinkDomain,
  log: Log,
  message: Message,
  messaging_service: MessagingService,
  messaging_service_stick: MessagingServiceStick,
  missing_external_sync_question_response_configuration: MissingExternalSyncQuestionResponseConfiguration,
  monthly_organization_message_usages: MonthlyOrganizationMessageUsages,
  opt_out: OptOut,
  organization: Organization,
  password_reset_request: PasswordResetRequest,
  pending_message_part: PendingMessagePart,
  question_response: QuestionResponse,
  tag: Tag,
  team: Team,
  team_escalation_tags: TeamEscalationTags,
  troll_alarm: TrollAlarm,
  troll_trigger: TrollTrigger,
  unhealthy_link_domain: UnhealthyLinkDomain,
  unsolicited_message: UnsolicitedMessage,
  user: User,
  user_cell: UserCell,
  user_organization: UserOrganization,
  user_team: UserTeam,
  v_troll_trigger: VTrollTrigger,
  zip_code: ZipCode
}