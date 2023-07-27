export const schema = `
  interface Register10DlcNotice {
    id: ID!
    tcrRegistrationUrl: String
  }

  type Register10DlcBrandNotice implements Register10DlcNotice {
    id: ID!
    tcrRegistrationUrl: String
  }

  type Register10DlcCampaignNotice implements Register10DlcNotice {
    id: ID!
    tcrRegistrationUrl: String
  }

  type Pending10DlcCampaignNotice {
    id: ID!
  }

  interface PricingNotice {
    id: ID!
  }

  type Pricing10DlcNotice implements PricingNotice {
    id: ID!
  }

  type PricingTollFreeNotice implements PricingNotice {
    id: ID!
  }

  union Notice = Register10DlcBrandNotice | Register10DlcCampaignNotice | Pending10DlcCampaignNotice | Pricing10DlcNotice | PricingTollFreeNotice

  type NoticeEdge {
    cursor: Cursor!
    node: Notice!
  }

  type NoticePage {
    edges: [NoticeEdge!]!
    pageInfo: RelayPageInfo!
  }
`;

export default schema;
