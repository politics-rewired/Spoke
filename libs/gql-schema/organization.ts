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
    tagList: [Tag!]!
    escalationTagList: [Tag!]!
    teams: [Team]!
    externalSystems(after: Cursor, first: Int): ExternalSystemPage!
    messagingServices(after: Cursor, first: Int, active: Boolean): MessagingServicePage
    messagingServicesCount(active: Boolean): Int
    campaignGroups(after: Cursor, first: Int): CampaignGroupPage!
    templateCampaigns(after: Cursor, first: Int): CampaignPage!
    deletedAt: String
    deletedBy: User
    autosendingMps: Int
  }

  input EditOrganizationInput {
    name: String
  }
`;
export default schema;
