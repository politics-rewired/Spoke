export const schema = `
  enum MessagingServiceType {
    TWILIO
    ASSEMBLE_NUMBERS
  }

  type MessagingService {
    id: ID!
    messagingServiceSid: String!
    serviceType: MessagingServiceType!
    updatedAt: String!
    tcrBrandRegistrationLink: String
    name: String
    active: Boolean!
    isDefault: Boolean
  }

  type MessagingServiceEdge {
    cursor: Cursor!
    node: MessagingService!
  }

  type MessagingServicePage {
    edges: [MessagingServiceEdge!]!
    pageInfo: RelayPageInfo!
  }
`;

export default schema;
