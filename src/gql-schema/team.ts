export const schema = `
  type Team {
    id: ID!
    title: String!
    description: String!
    textColor: String!
    backgroundColor: String!
    author: User
    isAssignmentEnabled: Boolean!
    assignmentPriority: Int
    assignmentType: TextRequestType
    maxRequestCount: Int
    createdAt: Date!

    users: [User]!
    campaigns: [Campaign]!
    escalationTags: [Tag]
  }

  input TeamInput {
    id: ID
    title: String
    description: String
    textColor: String
    backgroundColor: String
    isAssignmentEnabled: Boolean
    assignmentPriority: Int
    assignmentType: TextRequestType
    maxRequestCount: Int
    escalationTagIds: [String!]
  }
`;
export default schema;
