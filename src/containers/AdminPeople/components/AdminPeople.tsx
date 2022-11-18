import type { ApolloQueryResult } from "@apollo/client";
import { gql } from "@apollo/client";
import Button from "@material-ui/core/Button";
import Fab from "@material-ui/core/Fab";
import Snackbar from "@material-ui/core/Snackbar";
import AddIcon from "@material-ui/icons/Add";
import type { Campaign, CampaignsList } from "@spoke/spoke-codegen";
import { css, StyleSheet } from "aphrodite";
import isString from "lodash/fp/isString";
import { DropDownMenu, MenuItem } from "material-ui";
import queryString from "query-string";
import React from "react";
import { withRouter } from "react-router-dom";
import { compose } from "recompose";

import type { RequestAutoApproveType } from "../../../api/organization-membership";
import { UserRoleType } from "../../../api/organization-membership";
import { dataTest } from "../../../lib/attributes";
import type { MutationMap, QueryMap } from "../../../network/types";
import theme from "../../../styles/theme";
import { loadData } from "../../hoc/with-operations";
import type {
  AdminPeopleContext,
  CurrentUser,
  PeopleRowEventHandlers
} from "./context";
import Dialogs from "./Dialogs";
import { NameSearchBar } from "./NameSearchBar";
import PeopleTable from "./PeopleTable";

const styles = StyleSheet.create({
  filters: {
    display: "flex",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "flex-start"
  }
});

const AddPersonButton: React.StatelessComponent<{ onClick: () => void }> = ({
  onClick
}) => (
  <Fab
    {...dataTest("addPerson")}
    color="primary"
    style={theme.components.floatingButton}
    onClick={onClick}
  >
    <AddIcon />
  </Fab>
);

interface CampaignSelectorProps {
  campaigns: Campaign[];
  selectedId?: string | false;
  onChange: (newCampaignId: string | false) => void;
}
const CampaignSelector: React.StatelessComponent<CampaignSelectorProps> = ({
  selectedId,
  onChange,
  campaigns
}) => (
  <DropDownMenu
    value={selectedId}
    onChange={(event, index, newCampaignId) => onChange(newCampaignId)}
  >
    <MenuItem primaryText="All Campaigns" value={false} />
    {campaigns.map((campaign) => (
      <MenuItem
        value={campaign.id}
        primaryText={campaign.title}
        key={campaign.id}
      />
    ))}
  </DropDownMenu>
);

export interface AdminPeopleMutations {
  editOrganizationMembership: (
    membershipId: string,
    {
      autoApprove,
      role
    }: {
      autoApprove?: RequestAutoApproveType;
      role?: UserRoleType;
    }
  ) => Promise<
    ApolloQueryResult<{
      id: string;
      role: UserRoleType;
      requestAutoApprove: RequestAutoApproveType;
    }>
  >;
  resetUserPassword: (
    organizationId: string,
    userId: string
  ) => Promise<
    ApolloQueryResult<{
      resetUserPassword: string;
    }>
  >;
  setUserSuspended: (
    userId: string,
    isSuspended: boolean
  ) => Promise<
    ApolloQueryResult<{
      id: string;
      isSuspended: boolean;
    }>
  >;
  clearUserSessions: (
    userId: string
  ) => Promise<
    ApolloQueryResult<{
      id: string;
    }>
  >;
  removeUsers: () => Promise<
    ApolloQueryResult<{
      purgeOrganizationUsers: number;
    }>
  >;
  unassignTexts: (
    membershipId: string
  ) => Promise<
    ApolloQueryResult<{
      unassignTextsFromUser: string;
    }>
  >;
}

interface AdminPeopleExtensionProps {
  organizationData: {
    organization: {
      id: string;
      uuid: string;
      campaigns: CampaignsList;
    };
  };
  userData: {
    currentUser: CurrentUser;
  };
  mutations: AdminPeopleMutations;
}

interface AdminPeopleProps {
  organizationId: string;
}

type AdminPeopleExtendedProps = AdminPeopleExtensionProps & AdminPeopleProps;

interface AdminPeopleState {
  invite: {
    open: boolean;
  };
  filter: {
    nameSearch: string;
  };
  removeUsers: {
    open: boolean;
  };
  password: {
    open: boolean;
    hash: string;
  };
  userEdit: {
    open: boolean;
    userId: string;
  };
  confirmSuperadmin: {
    open: boolean;
    superadminMembershipId: string;
  };
  confirmUnassignTexts: {
    open: boolean;
    suspendedUserMembershipId: string;
  };
  error: {
    message: string;
    seen: boolean;
  };
}

class AdminPeople extends React.Component<
  AdminPeopleExtendedProps,
  AdminPeopleState
> {
  state = {
    invite: {
      open: false
    },
    filter: {
      nameSearch: ""
    },
    removeUsers: {
      open: false
    },
    password: {
      open: false,
      hash: ""
    },
    userEdit: {
      open: false,
      userId: ""
    },
    confirmSuperadmin: {
      open: false,
      superadminMembershipId: ""
    },
    confirmUnassignTexts: {
      open: false,
      suspendedUserMembershipId: ""
    },
    error: {
      message: "",
      seen: true
    }
  };

  handleConfirmSuperadmin = () => {
    const { superadminMembershipId } = this.state.confirmSuperadmin;
    this.handleEditMembershipRole(
      UserRoleType.SUPERADMIN,
      superadminMembershipId
    );
    this.handleCloseSuperadminDialog();
  };

  handleConfirmUnassignTexts = async (unassignTexts: boolean) => {
    const { suspendedUserMembershipId } = this.state.confirmUnassignTexts;
    if (unassignTexts) {
      await this.props.mutations.unassignTexts(suspendedUserMembershipId);
    }
    this.handleEditMembershipRole(
      UserRoleType.SUSPENDED,
      suspendedUserMembershipId
    );
    this.handleCloseUnassignTextsDialog();
  };

  handleEditMembershipRole = async (
    role: UserRoleType,
    membershipId: string
  ) => {
    const { editOrganizationMembership } = this.props.mutations;
    try {
      const response = await editOrganizationMembership(membershipId, {
        role
      });
      if (response.errors) throw response.errors;
    } catch (err) {
      this.setState({
        error: {
          message: `Couldn't update user role: ${err.message}`,
          seen: false
        }
      });
    }
  };

  handleEditAutoApprove = async (
    autoApprove: RequestAutoApproveType,
    membershipId: string
  ) => {
    const { editOrganizationMembership } = this.props.mutations;
    try {
      const response = await editOrganizationMembership(membershipId, {
        autoApprove
      });
      if (response.errors) throw response.errors;
    } catch (err) {
      this.setState({
        error: {
          message: `Couldn't update user approval level: ${err.message}`,
          seen: false
        }
      });
    }
  };

  handleCloseSuperadminDialog = () => {
    this.setState({
      confirmSuperadmin: { open: false, superadminMembershipId: "" }
    });
  };

  handleCloseUnassignTextsDialog = () => {
    this.setState(() => ({
      confirmUnassignTexts: { suspendedUserMembershipId: "", open: false }
    }));
  };

  startConfirmSuperadmin = (superadminMembershipId: string) =>
    this.setState(() => ({
      confirmSuperadmin: { superadminMembershipId, open: true }
    }));

  startConfirmUnassignTexts = (suspendedUserMembershipId: string) =>
    this.setState(() => ({
      confirmUnassignTexts: { suspendedUserMembershipId, open: true }
    }));

  handleCloseRemoveUsersDialog = () =>
    this.setState({
      removeUsers: { open: false }
    });

  handleConfirmRemoveUsers = async () => {
    this.handleCloseRemoveUsersDialog();
    try {
      await this.props.mutations.removeUsers();
    } catch (err) {
      this.setState({
        error: {
          message: `Couldn't remove users: ${err.message}`,
          seen: false
        }
      });
    }
  };

  handleResetPassword = async (userId: string) => {
    const { organizationId } = this.props;
    if (!organizationId) return;
    const { currentUser } = this.props.userData;
    if (currentUser.id !== userId) {
      const res = await this.props.mutations.resetUserPassword(
        organizationId,
        userId
      );
      const { resetUserPassword: hash } = res.data;
      this.setState({ password: { open: true, hash } });
    }
  };

  handleSetSuspended = async (userId: string, isSuspended: boolean) => {
    await this.props.mutations.setUserSuspended(userId, isSuspended);
  };

  handleClearSessions = async (userId: string) => {
    await this.props.mutations.clearUserSessions(userId);
  };

  ctx(): AdminPeopleContext {
    const { campaignId } = queryString.parse(this.props.location.search);
    return {
      viewing: {
        user: this.props.userData.currentUser
      },
      organization: this.props.organizationData.organization,
      campaignFilter: {
        onlyId: isString(campaignId) ? campaignId : false,
        showArchived: true
      }
    };
  }

  rowEventHandlers(): PeopleRowEventHandlers {
    return {
      startEdit: (userId) =>
        this.setState((prev) => ({
          userEdit: { ...prev.userEdit, userId, open: true }
        })),
      editMembershipRole: (role, membershipId) => {
        if (role === UserRoleType.SUPERADMIN) {
          this.startConfirmSuperadmin(membershipId);
        } else if (role === UserRoleType.SUSPENDED) {
          this.startConfirmUnassignTexts(membershipId);
        } else {
          this.handleEditMembershipRole(role, membershipId);
        }
      },
      editAutoApprove: (autoApprove, userId) =>
        this.handleEditAutoApprove(autoApprove, userId),
      resetUserPassword: (userId) => this.handleResetPassword(userId),
      setSuspended: (userId, isSuspended) =>
        this.handleSetSuspended(userId, isSuspended),
      clearSessions: (userId) => this.handleClearSessions(userId),
      error: (message) => this.setState({ error: { message, seen: false } })
    };
  }

  render() {
    return (
      <div>
        <div className={css(styles.filters)}>
          <NameSearchBar
            onChange={(newText) =>
              this.setState({ filter: { nameSearch: newText } })
            }
            onSubmit={(newText) =>
              this.setState({ filter: { nameSearch: newText } })
            }
          />
          <div style={{ marginTop: -8 }}>
            <CampaignSelector
              selectedId={this.ctx().campaignFilter.onlyId}
              campaigns={this.ctx().organization.campaigns.campaigns}
              onChange={(newCampaignId) => {
                this.props.history.push(
                  `/admin/${this.ctx().organization.id}/people?${
                    newCampaignId ? `campaignId=${newCampaignId}` : ""
                  }`
                );
              }}
            />
          </div>
          <Button
            variant="contained"
            color="primary"
            onClick={() => this.setState({ removeUsers: { open: true } })}
          >
            Remove Users
          </Button>
        </div>

        <PeopleTable
          context={this.ctx()}
          nameSearch={this.state.filter.nameSearch}
          onlyCampaignId={this.ctx().campaignFilter.onlyId}
          rowEventHandlers={this.rowEventHandlers()}
        />

        <AddPersonButton
          onClick={() => this.setState({ invite: { open: true } })}
        />

        <Dialogs.InvitePerson
          organizationUUID={this.ctx().organization.uuid}
          open={this.state.invite.open}
          onClose={() => this.setState({ invite: { open: false } })}
        />
        <Dialogs.EditPerson
          open={this.state.userEdit.open}
          organizationId={this.ctx().organization.id}
          userId={this.state.userEdit.userId}
          afterEditing={() => {
            this.setState({
              userEdit: { open: false, userId: "" }
            });
          }}
        />
        <Dialogs.ResetPassword
          open={this.state.password.open}
          passwordResetHash={this.state.password.hash}
          onClose={() => this.setState({ password: { open: false, hash: "" } })}
        />
        <Dialogs.ConfirmSuperAdmin
          open={this.state.confirmSuperadmin.open}
          onClose={this.handleCloseSuperadminDialog}
          handleConfirmSuperadmin={this.handleConfirmSuperadmin}
        />
        <Dialogs.ConfirmUnassignTexts
          open={this.state.confirmUnassignTexts.open}
          onClose={this.handleCloseUnassignTextsDialog}
          handleConfirmUnassignTexts={this.handleConfirmUnassignTexts}
        />
        <Dialogs.ConfirmRemoveUsers
          open={this.state.removeUsers.open}
          onClose={this.handleCloseRemoveUsersDialog}
          onConfirmRemoveUsers={this.handleConfirmRemoveUsers}
        />
        <Snackbar
          open={this.state.error.message.length > 0 && !this.state.error.seen}
          message={this.state.error.message}
          autoHideDuration={4000}
          onClose={() => this.setState({ error: { seen: true, message: "" } })}
        />
      </div>
    );
  }
}

const queries: QueryMap<AdminPeopleExtendedProps> = {
  userData: {
    query: gql`
      query getCurrentUserAndRoles($organizationId: String!) {
        currentUser {
          id
          memberships(organizationId: $organizationId) {
            edges {
              node {
                id
                role
              }
            }
          }
        }
      }
    `,
    options: ({ organizationId }: AdminPeopleExtendedProps) => ({
      variables: {
        organizationId
      }
    })
  },
  organizationData: {
    query: gql`
      query getOrganizationData($organizationId: String!) {
        organization(id: $organizationId) {
          id
          uuid
          campaigns(
            campaignsFilter: { isArchived: false }
            cursor: { offset: 0, limit: 5000 }
          ) {
            campaigns {
              id
              title
            }
          }
        }
      }
    `,
    options: ({ organizationId }: AdminPeopleExtendedProps) => ({
      variables: {
        organizationId
      }
    })
  }
};

const mutations: MutationMap<AdminPeopleExtendedProps> = {
  editOrganizationMembership: (_ownProps) => (
    membershipId,
    {
      autoApprove,
      role
    }: {
      autoApprove?: RequestAutoApproveType;
      role?: UserRoleType;
    }
  ) => ({
    mutation: gql`
      mutation editOrganizationMembership(
        $membershipId: String!
        $level: RequestAutoApprove
        $role: String
      ) {
        editOrganizationMembership(
          id: $membershipId
          level: $level
          role: $role
        ) {
          id
          role
          requestAutoApprove
        }
      }
    `,
    variables: {
      membershipId,
      level: autoApprove,
      role
    }
  }),
  resetUserPassword: (_ownProps) => (
    organizationId: string,
    userId: string
  ) => {
    return {
      mutation: gql`
        mutation resetUserPassword($organizationId: String!, $userId: String!) {
          resetUserPassword(organizationId: $organizationId, userId: $userId)
        }
      `,
      variables: {
        organizationId,
        userId
      }
    };
  },
  setUserSuspended: (_ownProps) => (userId: string, isSuspended: boolean) => {
    return {
      mutation: gql`
        mutation SetUserSuspended($userId: String!, $isSuspended: Boolean!) {
          setUserSuspended(userId: $userId, isSuspended: $isSuspended) {
            id
            isSuspended
          }
        }
      `,
      variables: {
        userId,
        isSuspended
      }
    };
  },
  clearUserSessions: (_ownProps) => (userId: string) => {
    return {
      mutation: gql`
        mutation ClearUserSessions($userId: String!) {
          clearUserSessions(userId: $userId) {
            id
          }
        }
      `,
      variables: {
        userId
      }
    };
  },
  removeUsers: (ownProps) => () => {
    return {
      mutation: gql`
        mutation PurgeOrganizationUsers($organizationId: String!) {
          purgeOrganizationUsers(organizationId: $organizationId)
        }
      `,
      variables: {
        organizationId: ownProps.organizationData.organization.id
      },
      refetchQueries: ["getPeople"]
    };
  },
  unassignTexts: (_ownProps) => (membershipId: string) => {
    return {
      mutation: gql`
        mutation UnassignTextsFromUser($membershipId: String!) {
          unassignTextsFromUser(membershipId: $membershipId)
        }
      `,
      variables: {
        membershipId
      }
    };
  }
};

export default compose<AdminPeopleExtendedProps, AdminPeopleProps>(
  withRouter,
  loadData({
    queries,
    mutations
  })
)(AdminPeople);
