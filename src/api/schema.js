import { schema as assignmentSchema } from "./assignment";
import { schema as assignmentRequestSchema } from "./assignment-request";
import { schema as campaignSchema } from "./campaign";
import { schema as campaignContactSchema } from "./campaign-contact";
import { schema as cannedResponseSchema } from "./canned-response";
import { schema as conversationSchema } from "./conversations";
import { schema as externalActivistCodeSchema } from "./external-activist-code";
import { schema as externalListSchema } from "./external-list";
import { schema as externalResultCodeSchema } from "./external-result-code";
import { schema as externalSurveyQuestionSchema } from "./external-survey-question";
import { schema as externalResponseOptionSchema } from "./external-survey-question-response-option";
import { schema as externalSyncConfigSchema } from "./external-sync-config";
import { schema as externalSystemSchema } from "./external-system";
import { schema as interactionStepSchema } from "./interaction-step";
import { schema as inviteSchema } from "./invite";
import { schema as linkDomainSchema } from "./link-domain";
import { schema as messageSchema } from "./message";
import { schema as optOutSchema } from "./opt-out";
import { schema as organizationSchema } from "./organization";
import { schema as membershipSchema } from "./organization-membership";
import { schema as organizationSettingsSchema } from "./organization-settings";
import { schema as paginationSchema } from "./pagination";
import { schema as questionSchema } from "./question";
import { schema as questionResponseSchema } from "./question-response";
import { schema as tagSchema } from "./tag";
import { schema as teamSchema } from "./team";
import { schema as trollbotSchema } from "./trollbot";
import { schema as userSchema } from "./user";

const rootSchema = `
  input CampaignContactInput {
    firstName: String!
    lastName: String!
    cell: String!
    zip: String
    external_id: String
    customFields: String
  }

  input BulkUpdateScriptInput {
    searchString: String!
    replaceString: String!
    includeArchived: Boolean!
    campaignTitlePrefixes: [String]!
  }

  input ContactActionInput {
    cell: Phone!
    assignmentId: String
    message: MessageInput
    reason: String
  }

  input ContactTagActionInput {
    addedTagIds: [String]!
    removedTagIds: [String]!
    message: MessageInput
  }

  input QuestionResponseInput {
    campaignContactId: String!
    interactionStepId: String!
    value: String!
  }

  input AnswerOptionInput {
    action: String
    value: String!
    nextInteractionStepId: String
  }

  input InteractionStepInput {
    id: String
    questionText: String
    scriptOptions: [String]!
    answerOption: String
    answerActions: String
    parentInteractionId: String
    isDeleted: Boolean
    interactionSteps: [InteractionStepInput]
  }

  input TexterInput {
    id: String
    needsMessageCount: Int
    maxContacts: Int
    contactsCount: Int
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
    excludeCampaignIds: [Int]
    contactSql: String
    organizationId: String
    isAssignmentLimitedToTeams: Boolean
    teamIds: [ID]
    texters: [TexterInput]
    interactionSteps: InteractionStepInput
    cannedResponses: [CannedResponseInput]
    textingHoursStart: Int
    textingHoursEnd: Int
    isAutoassignEnabled: Boolean
    timezone: String
    repliesStaleAfter: Int
  }

  input MessageInput {
    text: String
    contactNumber: Phone
    assignmentId: String
    userId: String
    versionHash: String
  }

  input InviteInput {
    id: String
    is_valid: Boolean
    hash: String
    created_at: Date
  }

  input UserInput {
    id: String
    firstName: String!
    lastName: String!
    email: String!
    cell: String!
    oldPassword: String
    newPassword: String
  }

  input ContactMessage {
    message: MessageInput!
    campaignContactId: String!
  }

  input OffsetLimitCursor {
    offset: Int!
    limit: Int!
  }

  input CampaignIdContactId {
    campaignId: String!
    campaignContactId: Int!
    messageIds: [Int]!
  }

  input UpdateLinkDomain {
    maxUsageCount: Int
    isManuallyDisabled: Boolean
  }

  enum ReleaseActionTarget {
    UNSENT
    UNREPLIED
  }

  input UserPasswordChange {
    password: String!
    passwordConfirm: String!
    newPassword: String!
  }

  type Action {
    name: String
    display_name: String
    instructions: String
  }

  type FoundContact {
    found: Boolean
  }

  input FetchCampaignOverlapInput {
    targetCampaignId: String!
    includeArchived: Boolean!
  }

  type FetchCampaignOverlapResult {
    campaign: Campaign!,
    overlapCount: Int!
    lastActivity: Date!
  }

  type DeleteCampaignOverlapResult {
    campaign: Campaign,
    deletedRowCount: Int!
    remainingCount: Int!
  }

  type PageInfo {
    limit: Int!
    offset: Int!
    next: Int
    previous: Int
    total: Int!
  }

  type ReturnString {
    data: String!
  }

  type ScriptUpdateResult {
    campaignId: String!
    found: String!
    replaced: String!
  }

  type ReleaseAllUnhandledRepliesResult {
    campaignCount: Int
    contactCount: Int
  }

  enum CampaignExportType {
    SPOKE
    VAN
  }

  input ExportForVanInput {
    includeUnmessaged: Boolean!
    vanIdField: String!
  }

  input CampaignExportInput {
    campaignId: String!
    exportType: CampaignExportType!
    vanOptions: ExportForVanInput
  }

  input QuestionResponseSyncConfigInput {
    id: String!
  }

  input QuestionResponseSyncTargetInput {
    configId: String!
    responseOptionId: String
    activistCodeId: String
    resultCodeId: String
  }

  input SyncCampaignToSystemInput {
    campaignId: String!
  }

  type RootQuery {
    currentUser: User
    organization(id:String!, utc:String): Organization
    campaign(id:String!): Campaign
    inviteByHash(hash:String!): [Invite]
    contact(id:String!): CampaignContact
    assignment(id:String!): Assignment
    team(id: String!): Team!
    organizations: [Organization]
    availableActions(organizationId:String!): [Action]
    conversations(cursor:OffsetLimitCursor!, organizationId:String!, campaignsFilter:CampaignsFilter, assignmentsFilter:AssignmentsFilter, tagsFilter: TagsFilter, contactsFilter:ContactsFilter, contactNameFilter:ContactNameFilter): PaginatedConversations
    campaigns(organizationId:String!, cursor:OffsetLimitCursor, campaignsFilter: CampaignsFilter): CampaignsReturn
    people(organizationId:String!, cursor:OffsetLimitCursor, campaignsFilter:CampaignsFilter, role: String, userIds:[String]): UsersReturn
    peopleByUserIds(userIds:[String], organizationId:String!): UsersList
    fetchCampaignOverlaps(input: FetchCampaignOverlapInput!): [FetchCampaignOverlapResult]!
    assignmentRequests(organizationId: String!, status: String): [AssignmentRequest]
    trollAlarms(organizationId: String!, limit: Int!, offset: Int!, token: String, dismissed: Boolean!): TrollAlarmPage!
    trollAlarmsCount(organizationId: String!, dismissed: Boolean!): TrollAlarmCount!,
    trollTokens(organizationId: String!): [TrollTrigger]
    externalSystem(systemId: String!): ExternalSystem!
    externalSystems(organizationId: String!, after: Cursor, first: Int): ExternalSystemPage!
    externalLists(organizationId: String!, systemId: String!, after: Cursor, first: Int): ExternalListPage!
  }

  type RootMutation {
    createInvite(invite:InviteInput!): Invite
    createCampaign(campaign:CampaignInput!): Campaign
    editCampaign(id:String!, campaign:CampaignInput!): Campaign
    filterLandlines(id:String!): Campaign
    bulkUpdateScript(organizationId:String!, findAndReplace: BulkUpdateScriptInput!): [ScriptUpdateResult]
    deleteJob(campaignId:String!, id:String!): JobRequest
    copyCampaign(id: String!): Campaign
    exportCampaign(options: CampaignExportInput!): JobRequest
    createCannedResponse(cannedResponse:CannedResponseInput!): CannedResponse
    createOrganization(name: String!, userId: String!, inviteId: String!): Organization
    joinOrganization(organizationUuid: String!): Organization!
    editOrganizationMembership(id: String!, level: RequestAutoApprove, role: String): OrganizationMembership!
    editOrganizationSettings(id: String!, input: OrganizationSettingsInput!): OranizationSettings!
    editUser(organizationId: String!, userId: Int!, userData:UserInput): User
    resetUserPassword(organizationId: String!, userId: Int!): String!
    changeUserPassword(userId: Int!, formData: UserPasswordChange): User
    updateTextingHours( organizationId: String!, textingHoursStart: Int!, textingHoursEnd: Int!): Organization
    updateTextingHoursEnforcement( organizationId: String!, textingHoursEnforced: Boolean!): Organization
    updateTextRequestFormSettings(organizationId: String!, textRequestFormEnabled: Boolean!, textRequestType: String!, textRequestMaxCount: Int!): Organization
    bulkSendMessages(assignmentId: Int!): [CampaignContact]
    sendMessage(message:MessageInput!, campaignContactId:String!): CampaignContact,
    tagConversation(campaignContactId: String!, tag: ContactTagActionInput!): CampaignContact
    createOptOut(optOut:ContactActionInput!, campaignContactId:String!):CampaignContact,
    removeOptOut(cell:Phone!):[CampaignContact],
    editCampaignContactMessageStatus(messageStatus: String!, campaignContactId:String!): CampaignContact,
    deleteQuestionResponses(interactionStepIds:[String], campaignContactId:String!): CampaignContact,
    updateQuestionResponses(questionResponses:[QuestionResponseInput], campaignContactId:String!): CampaignContact,
    startCampaign(id:String!): Campaign,
    archiveCampaign(id:String!): Campaign,
    unarchiveCampaign(id:String!): Campaign,
    sendReply(id: String!, message: String!): CampaignContact
    getAssignmentContacts(assignmentId: String!, contactIds: [String], findNew: Boolean): [CampaignContact],
    findNewCampaignContact(assignmentId: String!, numberContacts: Int!): FoundContact,
    assignUserToCampaign(organizationUuid: String!, campaignId: String!): Campaign
    userAgreeTerms(userId: String!): User
    megaReassignCampaignContacts(organizationId:String!, campaignIdsContactIds:[CampaignIdContactId]!, newTexterUserIds:[String]): Boolean!
    megaBulkReassignCampaignContacts(organizationId:String!, campaignsFilter:CampaignsFilter, assignmentsFilter:AssignmentsFilter, tagsFilter: TagsFilter, contactsFilter:ContactsFilter, contactNameFilter: ContactNameFilter, newTexterUserIds:[String]): Boolean!
    requestTexts(count: Int!, email: String!, organizationId: String!, preferredTeamId: Int!): String!
    releaseMessages(campaignId: String!, target: ReleaseActionTarget!, ageInHours: Float): String!
    releaseAllUnhandledReplies(organizationId: String!, ageInHours: Float, releaseOnRestricted: Boolean, limitToCurrentlyTextableContacts: Boolean): ReleaseAllUnhandledRepliesResult!
    markForSecondPass(campaignId: String!, excludeAgeInHours: Float): String!
    unMarkForSecondPass(campaignId: String!): String!
    deleteNeedsMessage(campaignId: String!): String!
    insertLinkDomain(organizationId: String!, domain: String!, maxUsageCount: Int!): LinkDomain!
    updateLinkDomain(organizationId: String!, domainId: String!, payload: UpdateLinkDomain!): LinkDomain!
    deleteLinkDomain(organizationId: String!, domainId: String!): Boolean!
    deleteCampaignOverlap(organizationId: String!, campaignId: String!, overlappingCampaignId: String!): DeleteCampaignOverlapResult!
    deleteManyCampaignOverlap(organizationId: String!, campaignId: String!, overlappingCampaignIds: [String]!): Int!
    resolveAssignmentRequest(assignmentRequestId: String!, approved: Boolean!, autoApproveLevel: RequestAutoApprove): Int!
    saveTag(organizationId: String!, tag: TagInput!): Tag!
    deleteTag(organizationId: String!, tagId: String!): Boolean!
    saveTeams(organizationId: String!, teams: [TeamInput]!): [Team]!
    deleteTeam(organizationId: String!, teamId: String!): Boolean!
    addUsersToTeam(teamId: String!, userIds: [String]!): Boolean!
    removeUsersFromTeam(teamId: String!, userIds: [String]!): Boolean!
    releaseMyReplies(organizationId: String!): Boolean!
    dismissMatchingAlarms(token: String!, organizationId: String!): Boolean!
    dismissAlarms(messageIds: [String!]!, organizationId: String!): Boolean!
    addToken(token: String!, organizationId: String!): Boolean!
    removeToken(token: String!, organizationId: String!): Boolean!
    createExternalSystem(organizationId: String!, externalSystem: ExternalSystemInput!): ExternalSystem!
    editExternalSystem(id: String!, externalSystem: ExternalSystemInput!): ExternalSystem!
    refreshExternalSystem(externalSystemId: String!): Boolean!
    createQuestionResponseSyncConfig(input: QuestionResponseSyncConfigInput!): ExternalSyncQuestionResponseConfig!
    deleteQuestionResponseSyncConfig(input: QuestionResponseSyncConfigInput!): ExternalSyncQuestionResponseConfig!
    createQuestionResponseSyncTarget(input: QuestionResponseSyncTargetInput!): ExternalSyncConfigTarget!
    deleteQuestionResponseSyncTarget(targetId: String!): String!
    syncCampaignToSystem(input: SyncCampaignToSystemInput!): Boolean!
  }

  schema {
    query: RootQuery
    mutation: RootMutation
  }
`;

export const schema = [
  rootSchema,
  userSchema,
  organizationSchema,
  paginationSchema,
  "scalar Upload",
  "scalar Date",
  "scalar JSON",
  "scalar Phone",
  organizationSettingsSchema,
  membershipSchema,
  campaignSchema,
  assignmentSchema,
  interactionStepSchema,
  optOutSchema,
  messageSchema,
  campaignContactSchema,
  cannedResponseSchema,
  questionResponseSchema,
  questionSchema,
  inviteSchema,
  linkDomainSchema,
  assignmentRequestSchema,
  conversationSchema,
  tagSchema,
  teamSchema,
  trollbotSchema,
  externalSystemSchema,
  externalListSchema,
  externalSurveyQuestionSchema,
  externalResponseOptionSchema,
  externalActivistCodeSchema,
  externalResultCodeSchema,
  externalSyncConfigSchema
];

export default rootSchema;
