export const schema = `
  type User {
    id: ID
    firstName: String
    lastName: String
    displayName: String!
    email: String
    cell: String
    memberships(organizationId: String, after: Cursor, first: Int): OrganizationMembershipPage
    organizations(active: Boolean, role: String): [Organization]
    todos(organizationId: String): [Assignment]
    roles(organizationId: String!): [UserRole!]!
    teams(organizationId: String!): [Team]!
    currentRequest(organizationId: String!): AssignmentRequest
    assignedCell: Phone
    assignment(campaignId: String): Assignment
    terms: Boolean
    isSuperadmin: Boolean!
    notificationFrequency: String!
    isSuspended: Boolean!
  }

  type UsersList {
    users: [User]
  }

  type PaginatedUsers {
    users: [User]
    pageInfo: PageInfo
  }

  union UsersReturn = PaginatedUsers | UsersList
`;
export default schema;
