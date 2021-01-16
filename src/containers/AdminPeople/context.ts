/* eslint-disable no-unused-vars */
import { CampaignsList } from "../../api/campaign";
import {
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
  editRole: (role: UserRoleType, userId: string) => void;
  editAutoApprove: (
    autoApprove: RequestAutoApproveType,
    userId: string
  ) => void;
  resetUserPassword: (userId: string) => void;
  error: (errorMsg: string) => void;
}
