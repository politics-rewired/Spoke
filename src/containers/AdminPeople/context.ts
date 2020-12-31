/* eslint-disable no-unused-vars */
import { CampaignsList } from "../../api/campaign";
import { UserRoleType } from "../../api/organization-membership";

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

export interface PersonMutationHandler {
  startEdit: (userId: string) => void;
  createHash: (hash: string) => void;
  wasUpdated: (userId: string) => void;
  error: (errorMsg: string) => void;
}
