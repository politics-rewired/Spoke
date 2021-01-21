import { css, StyleSheet } from "aphrodite";
import { ApolloQueryResult } from "apollo-client";
import gql from "graphql-tag";
import isString from "lodash/fp/isString";
import { DropDownMenu, MenuItem, Snackbar } from "material-ui";
import FloatingActionButton from "material-ui/FloatingActionButton";
import ContentAdd from "material-ui/svg-icons/content/add";
import queryString from "query-string";
import React from "react";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { compose } from "recompose";

import { Campaign, CampaignsList } from "../../api/campaign";
import {
  RequestAutoApproveType,
  UserRoleType
} from "../../api/organization-membership";
import { dataTest } from "../../lib/attributes";
import { MutationMap, QueryMap } from "../../network/types";
import theme from "../../styles/theme";
import { loadData } from "../hoc/with-operations";
import {
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
  <FloatingActionButton
    {...dataTest("addPerson")}
    style={theme.components.floatingButton}
    onClick={onClick}
  >
    <ContentAdd />
  </FloatingActionButton>
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
    userId: number
  ) => Promise<
    ApolloQueryResult<{
      resetUserPassword: string;
    }>
  >;
}

interface AdminPeopleRouteParams {
  organizationId?: string;
}

interface AdminPeopleExtensionProps
  extends RouteComponentProps<AdminPeopleRouteParams> {
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

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface AdminPeopleProps {}

type AdminPeopleExtendedProps = AdminPeopleExtensionProps & AdminPeopleProps;

interface AdminPeopleState {
  invite: {
    open: boolean;
  };
  filter: {
    nameSearch: string;
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
    superadminId: string;
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
      superadminId: ""
    },
    error: {
      message: "",
      seen: true
    }
  };

  handleConfirmSuperadmin = () => {
    const { superadminId } = this.state.confirmSuperadmin;
    this.handleEditRole(UserRoleType.SUPERADMIN, superadminId);
    this.handleCloseSuperadminDialog();
  };

  handleEditRole = async (role: UserRoleType, userId: string) => {
    const { editOrganizationMembership } = this.props.mutations;
    try {
      const response = await editOrganizationMembership(userId, {
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
    userId: string
  ) => {
    const { editOrganizationMembership } = this.props.mutations;
    try {
      const response = await editOrganizationMembership(userId, {
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
    this.setState({ confirmSuperadmin: { open: false, superadminId: "" } });
  };

  startConfirmSuperadmin = (superadminId: string) =>
    this.setState(() => ({
      confirmSuperadmin: { superadminId, open: true }
    }));

  handleResetPassword = async (userId: string) => {
    const { organizationId } = this.props.match.params;
    if (!organizationId) return;
    const { currentUser } = this.props.userData;
    if (currentUser.id !== userId) {
      const res = await this.props.mutations.resetUserPassword(
        organizationId,
        parseInt(userId, 10)
      );
      const { resetUserPassword: hash } = res.data;
      this.setState({ password: { open: true, hash } });
    }
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
      editRole: (role, userId) => {
        if (role === UserRoleType.SUPERADMIN) {
          this.startConfirmSuperadmin(userId);
        } else {
          this.handleEditRole(role, userId);
        }
      },
      editAutoApprove: (autoApprove, userId) =>
        this.handleEditAutoApprove(autoApprove, userId),
      resetUserPassword: (userId) => this.handleResetPassword(userId),
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
        <Snackbar
          open={this.state.error.message.length > 0 && !this.state.error.seen}
          message={this.state.error.message}
          autoHideDuration={4000}
          onRequestClose={() =>
            this.setState({ error: { seen: true, message: "" } })
          }
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
    options: ({
      match: {
        params: { organizationId }
      }
    }: AdminPeopleExtendedProps) => ({
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
    options: ({
      match: {
        params: { organizationId }
      }
    }: AdminPeopleExtendedProps) => ({
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
      membershipId: string;
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
    userId: number
  ) => {
    return {
      mutation: gql`
        mutation resetUserPassword($organizationId: String!, $userId: Int!) {
          resetUserPassword(organizationId: $organizationId, userId: $userId)
        }
      `,
      variables: {
        organizationId,
        userId
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
