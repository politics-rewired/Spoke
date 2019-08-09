export const schema = `
  type Team {
    id: ID!
    title: String!
    description: String!
    textColor: String!
    backgroundColor: String!
    author: User
    assignmentPriority: Int!
    createdAt: Date!

    users: [User]!
    campaigns: [Campaign]!
  }

  input TeamInput {
    id: ID
    title: String!
    description: String!
    textColor: String!
    backgroundColor: String!
    assignmentPriority: Int!
  }
`;
