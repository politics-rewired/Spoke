import { RelayEdge, RelayPaginatedResponse } from "./pagination";
import { GraphQLType } from "./types";

export interface Register10DlcBrandNotice {
  id: string;
  tcrBrandRegistrationUrl: string;
}

export type Notice = Register10DlcBrandNotice;

export function isRegister10DlcBrandNotice(
  obj: Notice
): obj is Register10DlcBrandNotice {
  return (
    (obj as Register10DlcBrandNotice & GraphQLType).__typename ===
    "Register10DlcBrandNotice"
  );
}

export type NoticeEdge = RelayEdge<Notice>;

export type NoticePage = RelayPaginatedResponse<Notice>;

export const schema = `
  type Register10DlcBrandNotice {
    id: ID!
    tcrBrandRegistrationUrl: String!
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
