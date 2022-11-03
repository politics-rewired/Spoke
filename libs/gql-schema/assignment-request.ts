export const schema = `
  type AssignmentRequest {
    id: ID!
    amount: Int!
    organization: Organization!
    createdAt: Date!
    updatedAt: Date!
    user: User!
    status: String!
  }
`;

export default schema;
