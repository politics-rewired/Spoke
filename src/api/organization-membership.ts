/* eslint-disable no-unused-vars */
import { Organization } from "./organization";
import { RelayPageInfo } from "./pagination";
import { User } from "./user";

export enum UserRoleType {
  TEXTER = "TEXTER",
  SUPERVOLUNTEER = "SUPERVOLUNTEER",
  ADMIN = "ADMIN",
  OWNER = "OWNER"
}

export enum RequestAutoApproveType {
  DO_NOT_APPROVE = "DO_NOT_APPROVE",
  APPROVAL_REQUIRED = "APPROVAL_REQUIRED",
  AUTO_APPROVE = "AUTO_APPROVE"
}

export interface MembershipFilter {
  nameSearch?: string;
  campaignId?: number;
  campaignArchived?: boolean;
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
    TEXTER
    SUPERVOLUNTEER
    ADMIN
    OWNER
  }

  enum RequestAutoApprove {
    DO_NOT_APPROVE
    APPROVAL_REQUIRED
    AUTO_APPROVE
  }

  input MembershipFilter {
    nameSearch: String
    campaignId: Int
    campaignArchived: Boolean
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
