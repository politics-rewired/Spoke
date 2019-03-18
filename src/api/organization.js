export const TextRequestType = Object.freeze({ UNSENT: 'UNSENT', UNREPLIED: 'UNREPLIED' })

export const schema = `
  enum TextRequestType {
    UNSENT
    UNREPLIED
  }

  type Organization {
    id: ID
    uuid: String
    name: String
    campaigns(cursor:OffsetLimitCursor, campaignsFilter: CampaignsFilter): PaginatedCampaigns
    people(role: String, campaignId: String): [User]
    optOuts: [OptOut]
    threeClickEnabled: Boolean
    optOutMessage: String
    textingHoursEnforced: Boolean
    textingHoursStart: Int
    textingHoursEnd: Int
    textRequestFormEnabled: Boolean
    textRequestType: TextRequestType
    textRequestReplyAge: Float
    textRequestMaxCount: Int
    textsAvailable: Boolean
  }
`