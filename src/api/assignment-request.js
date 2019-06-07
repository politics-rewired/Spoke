export const schema = `
  type AssignmentRequest {
    id: ID!
    organization: Organization!
    createdAt: Date!
    updatedAt: Date!
    user: User!
    status: String!
  }
`;
