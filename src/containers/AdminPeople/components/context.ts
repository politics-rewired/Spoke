/* eslint-disable no-unused-vars */
import type { CampaignsList } from "@spoke/spoke-codegen";

import type {
  RequestAutoApproveType,
  UserRoleType
} from "../../api/organization-membership";

export interface CurrentUser {
  id: string;
  memberships: {
    edges: {
      node: { id: string; role: UserRoleType };
    }[];
  };
}

export interface AdminPeopleContext {
  viewing: {
    user: CurrentUser;
  };
  organization: {
    id: string;
    uuid: string;
    campaigns: CampaignsList;
  };
  campaignFilter: {
    showArchived: boolean;
    onlyId: string | false;
  };
}

export interface PeopleRowEventHandlers {
  startEdit: (userId: string) => void;
  editMembershipRole: (role: UserRoleType, membershipId: string) => void;
  editAutoApprove: (
    autoApprove: RequestAutoApproveType,
    membershipId: string
  ) => void;
  setSuspended: (membershipId: string, isSuspended: boolean) => void;
  clearSessions: (membershipId: string) => void;
  resetUserPassword: (userId: string) => void;
  error: (errorMsg: string) => void;
}
