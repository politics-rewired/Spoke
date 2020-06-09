export const TextRequestType = Object.freeze({
  UNSENT: "UNSENT",
  UNREPLIED: "UNREPLIED"
});

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
    externalSystems: ExternalSystemPage!
  }
`;
