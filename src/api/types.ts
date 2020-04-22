export interface RelayPaginatedResponse<T> {
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor?: string;
  endCursor?: string;
  edges: {
    cursor: string;
    node: T;
  }[];
}
