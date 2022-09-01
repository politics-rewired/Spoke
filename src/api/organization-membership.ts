/* eslint-disable no-unused-vars */
import type { Organization } from "./organization";
import type { RelayPageInfo } from "./pagination";
import type { User } from "./user";

export enum UserRoleType {
  SUSPENDED = "SUSPENDED",
  TEXTER = "TEXTER",
  SUPERVOLUNTEER = "SUPERVOLUNTEER",
  ADMIN = "ADMIN",
  OWNER = "OWNER",
  SUPERADMIN = "SUPERADMIN"
}

export enum RequestAutoApproveType {
  DO_NOT_APPROVE = "DO_NOT_APPROVE",
  APPROVAL_REQUIRED = "APPROVAL_REQUIRED",
  AUTO_APPROVE = "AUTO_APPROVE"
}

export interface MembershipFilter {
  nameSearch?: string;
  campaignId?: string;
  campaignArchived?: boolean;
  roles?: string[];
}

export interface OrganizationMembership {
  id: string;
  user: User;
  organization: Organization;
  requestAutoApprove: RequestAutoApproveType;
  role: UserRoleType;
}

export interface OrganizationMembershipEdge {
  cursor: string;
  node: OrganizationMembership;
}
export interface OrganizationMembershipPage {
  edges: OrganizationMembershipEdge[];
  pageInfo: RelayPageInfo;
}

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
