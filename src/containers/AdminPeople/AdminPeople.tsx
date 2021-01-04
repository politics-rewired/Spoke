import { css, StyleSheet } from "aphrodite";
import gql from "graphql-tag";
import { isString } from "lodash/fp";
import { DropDownMenu, MenuItem, Snackbar } from "material-ui";
import FloatingActionButton from "material-ui/FloatingActionButton";
import ContentAdd from "material-ui/svg-icons/content/add";
import queryString from "query-string";
import React from "react";
import { RouteComponentProps, withRouter } from "react-router-dom";
import { compose } from "recompose";

import { Campaign, CampaignsList } from "../../api/campaign";
import { dataTest } from "../../lib/attributes";
import { QueryMap } from "../../network/types";
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
    width: 1245,
    maxWidth: "92vw",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingLeft: 0
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
  error: {
    message: string;
    seen: boolean;
  };
  lastMutated: Date;
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
    error: {
      message: "",
      seen: true
    },
    lastMutated: new Date()
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
      createHash: (hash) =>
        this.setState({
          password: { hash, open: true }
        }),
      wasUpdated: () => this.setState({ lastMutated: new Date() }),
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
          lastMutated={this.state.lastMutated}
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
              userEdit: { open: false, userId: "" },
              lastMutated: new Date()
            });
          }}
        />
        <Dialogs.ResetPassword
          open={this.state.password.open}
          passwordResetHash={this.state.password.hash}
          onClose={() => this.setState({ password: { open: false, hash: "" } })}
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

export default compose<AdminPeopleExtendedProps, AdminPeopleProps>(
  withRouter,
  loadData({
    queries
  })
)(AdminPeople);
