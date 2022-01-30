import { Assignment } from "./assignment";
import { AssignmentRequest } from "./assignment-request";
import { Organization } from "./organization";
import {
  OrganizationMembership,
  UserRoleType
} from "./organization-membership";
import { RelayPaginatedResponse } from "./pagination";
import { Team } from "./team";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  cell: string;
  memberships: RelayPaginatedResponse<OrganizationMembership>;
  organizations: Organization[];
  todos: Assignment[];
  roles: UserRoleType[];
  teams: Team[];
  currentRequest: AssignmentRequest;
  assignedCell: string;
  assignment: Assignment;
  terms: boolean;
}

export const schema = `
  type User {
    id: ID
    firstName: String
    lastName: String
    displayName: String
    email: String
    cell: String
    memberships(organizationId: String, after: Cursor, first: Int): OrganizationMembershipPage
    organizations(role: String): [Organization]
    todos(organizationId: String): [Assignment]
    roles(organizationId: String!): [String!]!
    teams(organizationId: String!): [Team]!
    currentRequest(organizationId: String!): AssignmentRequest
    assignedCell: Phone
    assignment(campaignId: String): Assignment,
    terms: Boolean
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
