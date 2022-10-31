export const schema = `
  enum UserRole {
    SUSPENDED
    TEXTER
    SUPERVOLUNTEER
    ADMIN
    OWNER
    SUPERADMIN
  }

  enum RequestAutoApprove {
    DO_NOT_APPROVE
    APPROVAL_REQUIRED
    AUTO_APPROVE
  }

  input MembershipFilter {
    nameSearch: String
    campaignId: String
    campaignArchived: Boolean
    roles: [String!]
  }

  type OrganizationMembership {
    id: ID!
    user: User!
    organization: Organization!
    role: UserRole!
    requestAutoApprove: RequestAutoApprove!
  }

  type OrganizationMembershipEdge {
    cursor: Cursor!
    node: OrganizationMembership!
  }

  type OrganizationMembershipPage {
    edges: [OrganizationMembershipEdge!]!
    pageInfo: RelayPageInfo!
  }
`;
export default schema;
