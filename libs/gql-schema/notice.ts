export const schema = `
  type Register10DlcBrandNotice {
    id: ID!
    tcrBrandRegistrationUrl: String
  }

  union Notice = Register10DlcBrandNotice

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
