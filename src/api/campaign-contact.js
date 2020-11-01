export const schema = `
  input ContactsFilter {
    messageStatus: String
    isOptedOut: Boolean
    validTimezone: Boolean
    includePastDue: Boolean
  }

  type Location {
    city: String
    state: String
  }

  input ContactNameFilter {
    firstName: String
    lastName: String
  }

  type CampaignContact {
    id: ID
    firstName: String
    lastName: String
    cell: Phone
    zip: String
    external_id: String
    customFields: JSON
    messages: [Message]
    timezone: String
    location: Location
    optOut: OptOut
    campaign: Campaign
    questionResponseValues: [AnswerOption]
    questionResponses: [AnswerOption]
    interactionSteps: [InteractionStep]
    messageStatus: String
    assignmentId: String
    updatedAt: Date

    contactTags: [Tag]
  }
`;

export default schema;
