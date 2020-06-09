export interface RelayPageInfo {
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

export interface RelayEdge<T> {
  cursor: string;
  node: T;
}

export interface RelayPaginatedResponse<T> {
  pageInfo: RelayPageInfo;
  edges: RelayEdge<T>[];
}

export const schema = `
  scalar Cursor

  type RelayPageInfo {
    totalCount: Int!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: Cursor
    endCursor: Cursor
  }
`;
