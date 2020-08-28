export const schema = `
  input CampaignsFilter {
    isArchived: Boolean
    campaignId: Int
    listSize: Int
    pageSize: Int
  }

  type CampaignStats {
    sentMessagesCount: Int
    receivedMessagesCount: Int
    optOutsCount: Int
  }

  type JobRequest {
    id: String
    jobType: String
    assigned: Boolean
    status: Int
    resultMessage: String
  }

  type CampaignReadiness {
    id: ID!
    basics: Boolean!
    textingHours: Boolean!
    contacts: Boolean!
    autoassign: Boolean!
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
    textingHoursStart: Int
    textingHoursEnd: Int
    isAutoassignEnabled: Boolean!
    repliesStaleAfter: Int
    isAssignmentLimitedToTeams: Boolean!
    timezone: String
    createdAt: Date
    previewUrl: String
    landlinesFiltered: Boolean!
    externalSyncConfigurations(after: Cursor, first: Int): ExternalSyncQuestionResponseConfigPage!
  }

  type CampaignsList {
    campaigns: [Campaign]
  }

  union CampaignsReturn = PaginatedCampaigns | CampaignsList

  type PaginatedCampaigns {
    campaigns: [Campaign]
    pageInfo: PageInfo
  }
`;
