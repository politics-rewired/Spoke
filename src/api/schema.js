import {
  schema as userSchema,
  resolvers as userResolvers,
  buildUserOrganizationQuery
} from "./user";
import {
  schema as conversationSchema,
  getConversations,
  resolvers as conversationsResolver
} from "./conversations";
import {
  schema as organizationSchema,
  resolvers as organizationResolvers
} from "./organization";
import {
  schema as campaignSchema,
  resolvers as campaignResolvers
} from "./campaign";
import {
  schema as assignmentSchema,
  resolvers as assignmentResolvers
} from "./assignment";
import {
  schema as interactionStepSchema,
  resolvers as interactionStepResolvers
} from "./interaction-step";
import {
  schema as questionSchema,
  resolvers as questionResolvers
} from "./question";
import {
  schema as questionResponseSchema,
  resolvers as questionResponseResolvers
} from "./question-response";
import {
  schema as optOutSchema,
  resolvers as optOutResolvers
} from "./opt-out";
import {
  schema as messageSchema,
  resolvers as messageResolvers
} from "./message";
import {
  schema as campaignContactSchema,
  resolvers as campaignContactResolvers
} from "./campaign-contact";
import {
  schema as cannedResponseSchema,
  resolvers as cannedResponseResolvers
} from "./canned-response";
import { schema as inviteSchema, resolvers as inviteResolvers } from "./invite";
import { schema as linkDomainSchema } from "./link-domain";
import { schema as assignmentRequestSchema } from "./assignment-request";

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
    assignmentId: String!
    cell: Phone!
    message: MessageInput
    reason: String
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
    useDynamicAssignment: Boolean
    contacts: [CampaignContactInput]
    excludeCampaignIds: [Int]
    contactSql: String
    organizationId: String
    texters: [TexterInput]
    interactionSteps: InteractionStepInput
    cannedResponses: [CannedResponseInput]
    overrideOrganizationTextingHours: Boolean
    textingHoursEnforced: Boolean
    textingHoursStart: Int
    textingHoursEnd: Int
    isAutoassignEnabled: Boolean
    timezone: String
  }

  input MessageInput {
    text: String
    contactNumber: Phone
    assignmentId: String
    userId: String
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

  type CampaignIdAssignmentId {
    campaignId: String!
    assignmentId: String
  }

  type Action {
    name: String
    display_name: String
    instructions: String
  }

  type FoundContact {
    found: Boolean
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


  type RootQuery {
    currentUser: User
    organization(id:String!, utc:String): Organization
    campaign(id:String!): Campaign
    inviteByHash(hash:String!): [Invite]
    contact(id:String!): CampaignContact
    assignment(id:String!): Assignment
    organizations: [Organization]
    availableActions(organizationId:String!): [Action]
    conversations(cursor:OffsetLimitCursor!, organizationId:String!, campaignsFilter:CampaignsFilter, assignmentsFilter:AssignmentsFilter, contactsFilter:ContactsFilter, contactNameFilter:ContactNameFilter, utc:String): PaginatedConversations
    campaigns(organizationId:String!, cursor:OffsetLimitCursor, campaignsFilter: CampaignsFilter): CampaignsReturn
    people(organizationId:String!, cursor:OffsetLimitCursor, campaignsFilter:CampaignsFilter, role: String, userIds:[String]): UsersReturn
    peopleByUserIds(userIds:[String], organizationId:String!): UsersList
    fetchCampaignOverlaps(organizationId: String!, campaignId: String!): [FetchCampaignOverlapResult]!
    assignmentRequests(organizationId: String!, status: String): [AssignmentRequest]
  }

  type RootMutation {
    createInvite(invite:InviteInput!): Invite
    createCampaign(campaign:CampaignInput!): Campaign
    editCampaign(id:String!, campaign:CampaignInput!): Campaign
    bulkUpdateScript(organizationId:String!, findAndReplace: BulkUpdateScriptInput!): [ScriptUpdateResult]
    deleteJob(campaignId:String!, id:String!): JobRequest
    copyCampaign(id: String!): Campaign
    exportCampaign(id:String!): JobRequest
    createCannedResponse(cannedResponse:CannedResponseInput!): CannedResponse
    createOrganization(name: String!, userId: String!, inviteId: String!): Organization
    joinOrganization(organizationUuid: String!): Organization
    editOrganizationRoles(organizationId: String!, userId: String!, campaignId: String, roles: [String]): Organization
    editUser(organizationId: String!, userId: Int!, userData:UserInput): User
    updateTextingHours( organizationId: String!, textingHoursStart: Int!, textingHoursEnd: Int!): Organization
    updateTextingHoursEnforcement( organizationId: String!, textingHoursEnforced: Boolean!): Organization
    updateTextRequestFormSettings(organizationId: String!, textRequestFormEnabled: Boolean!, textRequestType: String!, textRequestMaxCount: Int!): Organization
    updateOptOutMessage( organizationId: String!, optOutMessage: String!): Organization
    updateEscalationUserId(organizationId: String!, escalationUserId: Int): Organization
    bulkSendMessages(assignmentId: Int!): [CampaignContact]
    sendMessage(message:MessageInput!, campaignContactId:String!): CampaignContact,
    escalateConversation(campaignContactId: String!, escalate: ContactActionInput!): CampaignContact
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
    reassignCampaignContacts(organizationId:String!, campaignIdsContactIds:[CampaignIdContactId]!, newTexterUserId:String!):[CampaignIdAssignmentId],
    bulkReassignCampaignContacts(organizationId:String!, campaignsFilter:CampaignsFilter, assignmentsFilter:AssignmentsFilter, contactsFilter:ContactsFilter, newTexterUserId:String!):[CampaignIdAssignmentId]
    megaReassignCampaignContacts(organizationId:String!, campaignIdsContactIds:[CampaignIdContactId]!, newTexterUserIds:[String]):[CampaignIdAssignmentId]
    megaBulkReassignCampaignContacts(organizationId:String!, campaignsFilter:CampaignsFilter, assignmentsFilter:AssignmentsFilter, contactsFilter:ContactsFilter, newTexterUserIds:[String]):[CampaignIdAssignmentId]
    requestTexts(count: Int!, email: String!, organizationId: String!): String!
    releaseMessages(campaignId: String!, target: ReleaseActionTarget!, ageInHours: Int): String!
    markForSecondPass(campaignId: String!, excludeAgeInHours: Int): String!
    insertLinkDomain(organizationId: String!, domain: String!, maxUsageCount: Int!): LinkDomain!
    updateLinkDomain(organizationId: String!, domainId: String!, payload: UpdateLinkDomain!): LinkDomain!
    deleteLinkDomain(organizationId: String!, domainId: String!): Boolean!
    deleteCampaignOverlap(organizationId: String!, campaignId: String!, overlappingCampaignId: String!): DeleteCampaignOverlapResult!
    approveAssignmentRequest(assignmentRequestId: String!): Int!
    rejectAssignmentRequest(assignmentRequestId: String!): Boolean!
    setNumbersApiKey(organizationId: String!, numbersApiKey: String!): Organization!
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
  "scalar Date",
  "scalar JSON",
  "scalar Phone",
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
  conversationSchema
];
