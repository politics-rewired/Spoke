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
export default schema;
