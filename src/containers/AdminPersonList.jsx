import React from "react";
import PropTypes from "prop-types";
import { withRouter } from "react-router";
import { compose } from "react-apollo";
import gql from "graphql-tag";
import queryString from "query-string";

import { Table, TableBody, TableRow, TableRowColumn } from "material-ui/Table";
import FlatButton from "material-ui/FlatButton";
import FloatingActionButton from "material-ui/FloatingActionButton";
import DropDownMenu from "material-ui/DropDownMenu";
import MenuItem from "material-ui/MenuItem";
import Dialog from "material-ui/Dialog";
import Snackbar from "material-ui/Snackbar";
import PeopleIcon from "material-ui/svg-icons/social/people";
import ContentAdd from "material-ui/svg-icons/content/add";

import { hasRoleAtLeast } from "../lib/permissions";
import {
  UserRoleType,
  RequestAutoApproveType
} from "../api/organization-membership";
import { dataTest } from "../lib/attributes";
import { snakeToTitleCase } from "../lib/attributes";
import { loadData } from "./hoc/with-operations";
import theme from "../styles/theme";
import UserEdit from "./UserEdit";
import Empty from "../components/Empty";
import OrganizationJoinLink from "../components/OrganizationJoinLink";
import PasswordResetLink from "../components/PasswordResetLink";
import LoadingIndicator from "../components/LoadingIndicator";

class AdminPersonList extends React.Component {
  state = {
    open: false,
    userEdit: false,
    passwordResetHash: "",
    isWorking: false,
    saveError: undefined
  };

  handleFilterChange = (campaignId, offset) => {
    let query = "?" + (campaignId ? `campaignId=${campaignId}` : "");
    query += offset ? `&offset=${offset}` : "";
    const { organizationId } = this.props.match.params;
    this.props.history.push(`/admin/${organizationId}/people${query}`);
  };

  handleCampaignChange = (event, index, value) => {
    // We send 0 when there is a campaign change, because presumably we start on page 1
    this.handleFilterChange(value, 0);
  };

  handleOffsetChange = (event, index, value) => {
    const { campaignId } = queryString.parse(this.props.location.search);
    this.handleFilterChange(campaignId, value);
  };

  handleOpen = () => this.setState({ open: true });

  handleClose = () => this.setState({ open: false, passwordResetHash: "" });

  handleDismissSaveError = () => this.setState({ saveError: undefined });

  handleRoleChange = membershipId => async (_event, _index, role) => {
    const { editOrganizationMembership } = this.props.mutations;
    this.setState({ isWorking: true, saveError: undefined });
    try {
      const response = await editOrganizationMembership(membershipId, { role });
      if (response.errors) throw response.errors;
    } catch (err) {
      this.setState({
        saveError: `Couldn't update user role: ${err.message}`
      });
    } finally {
      this.setState({ isWorking: false });
    }
  };

  handleOnChangeAutoApprovalLevel = membershipId => async (
    _event,
    _index,
    level
  ) => {
    const { editOrganizationMembership } = this.props.mutations;
    this.setState({ isWorking: true, saveError: undefined });
    try {
      const response = await editOrganizationMembership(membershipId, {
        level
      });
      if (response.errors) throw response.errors;
    } catch (err) {
      this.setState({
        saveError: `Couldn't update approval level: ${err.message}`
      });
    } finally {
      this.setState({ isWorking: false });
    }
  };

  editUser = userId => this.setState({ userEdit: userId });

  updateUser = () => {
    this.setState({ userEdit: false });
    this.props.personData.refetch();
  };

  renderOffsetList() {
    const LIMIT = 200;
    const {
      personData: { organization }
    } = this.props;
    if (organization.peopleCount > LIMIT) {
      const offsetList = Array.apply(null, {
        length: Math.ceil(organization.peopleCount / LIMIT)
      });
      const { offset } = queryString.parse(this.props.location.search);
      return (
        <DropDownMenu
          value={offset == "all" ? "all" : Number(offset || 0)}
          onChange={this.handleOffsetChange}
        >
          {[<MenuItem value="all" primaryText="All" key="all" />].concat(
            offsetList.map((x, i) => (
              <MenuItem value={i} primaryText={`Page ${i + 1}`} key={i + 1} />
            ))
          )}
        </DropDownMenu>
      );
    }
    return null;
  }

  async resetPassword(userId) {
    const { organizationId } = this.props.match.params;
    const { currentUser } = this.props.userData;
    if (currentUser.id !== userId) {
      const res = await this.props.mutations.resetUserPassword(
        organizationId,
        userId
      );
      const { resetUserPassword } = res.data;
      this.setState({ passwordResetHash: resetUserPassword });
    }
  }

  renderCampaignList() {
    const {
      organizationData: { organization }
    } = this.props;
    const campaigns = organization ? organization.campaigns : [];
    const { campaignId } = queryString.parse(this.props.location.search);
    return (
      <DropDownMenu value={campaignId} onChange={this.handleCampaignChange}>
        <MenuItem primaryText="All Campaigns" />
        {campaigns.campaigns.map(campaign => (
          <MenuItem
            value={campaign.id}
            primaryText={campaign.title}
            key={campaign.id}
          />
        ))}
      </DropDownMenu>
    );
  }

  renderTexters() {
    const {
      personData,
      userData: { currentUser }
    } = this.props;
    if (!currentUser) return <LoadingIndicator />;

    const people =
      (personData.organization && personData.organization.people) || [];
    if (people.length === 0) {
      return <Empty title="No people yet" icon={<PeopleIcon />} />;
    }

    const canResetPassword = window.PASSPORT_STRATEGY === "local";

    return (
      <Table selectable={false}>
        <TableBody displayRowCheckbox={false} showRowHover>
          {people.map(person => (
            <TableRow key={person.id}>
              <TableRowColumn>{person.displayName}</TableRowColumn>
              <TableRowColumn>{person.email}</TableRowColumn>
              <TableRowColumn>
                <DropDownMenu
                  value={person.memberships.edges[0].node.role}
                  disabled={
                    person.id === currentUser.id ||
                    (person.memberships.edges[0].node.role === "OWNER" &&
                      currentUser.memberships.edges[0].node.role !== "OWNER")
                  }
                  onChange={this.handleRoleChange(
                    person.memberships.edges[0].node.id
                  )}
                >
                  {Object.keys(UserRoleType).map(option => (
                    <MenuItem
                      key={`${person.id}_${option}`}
                      value={option}
                      disabled={
                        option === "OWNER" &&
                        currentUser.memberships.edges[0].node.role !== "OWNER"
                      }
                      primaryText={snakeToTitleCase(option)}
                    />
                  ))}
                </DropDownMenu>
              </TableRowColumn>
              <TableRowColumn>
                <DropDownMenu
                  value={person.memberships.edges[0].node.requestAutoApprove}
                  disabled={
                    !hasRoleAtLeast(
                      currentUser.memberships.edges[0].node.role,
                      "ADMIN"
                    )
                  }
                  onChange={this.handleOnChangeAutoApprovalLevel(
                    person.memberships.edges[0].node.id
                  )}
                >
                  {Object.keys(RequestAutoApproveType).map(option => (
                    <MenuItem
                      key={`${person.id}_${option}`}
                      value={option}
                      disabled={false}
                      primaryText={snakeToTitleCase(option)}
                    />
                  ))}
                </DropDownMenu>
              </TableRowColumn>
              <TableRowColumn>
                <FlatButton
                  {...dataTest("editPerson")}
                  label="Edit"
                  onTouchTap={() => {
                    this.editUser(person.id);
                  }}
                />
              </TableRowColumn>
              {canResetPassword && (
                <TableRowColumn>
                  <FlatButton
                    label="Reset Password"
                    disabled={currentUser.id === person.id}
                    onTouchTap={() => {
                      this.resetPassword(person.id);
                    }}
                  />
                </TableRowColumn>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  render() {
    const { organizationData } = this.props;

    return (
      <div>
        {this.renderCampaignList()}
        {this.renderOffsetList()}
        {this.renderTexters()}
        <FloatingActionButton
          {...dataTest("addPerson")}
          style={theme.components.floatingButton}
          onTouchTap={this.handleOpen}
        >
          <ContentAdd />
        </FloatingActionButton>
        {organizationData.organization && (
          <div>
            <Dialog
              {...dataTest("editPersonDialog")}
              title="Edit user"
              modal={false}
              open={Boolean(this.state.userEdit)}
              onRequestClose={() => {
                this.setState({ userEdit: false });
              }}
            >
              <UserEdit
                organizationId={
                  organizationData.organization &&
                  organizationData.organization.id
                }
                userId={this.state.userEdit}
                onRequestClose={this.updateUser}
              />
            </Dialog>
            <Dialog
              title="Invite new texters"
              actions={[
                <FlatButton
                  {...dataTest("inviteOk")}
                  label="OK"
                  primary
                  onTouchTap={this.handleClose}
                />
              ]}
              modal={false}
              open={this.state.open}
              onRequestClose={this.handleClose}
            >
              <OrganizationJoinLink
                organizationUuid={organizationData.organization.uuid}
              />
            </Dialog>
            <Dialog
              title="Reset user password"
              actions={[
                <FlatButton
                  {...dataTest("passResetOK")}
                  label="OK"
                  primary
                  onTouchTap={this.handleClose}
                />
              ]}
              modal={false}
              open={Boolean(this.state.passwordResetHash)}
              onRequestClose={this.handleClose}
            >
              <PasswordResetLink
                passwordResetHash={this.state.passwordResetHash}
              />
            </Dialog>
          </div>
        )}
        <Snackbar
          open={this.state.saveError !== undefined}
          message={this.state.saveError || ""}
          autoHideDuration={4000}
          onRequestClose={this.handleDismissSaveError}
        />
      </div>
    );
  }
}

AdminPersonList.propTypes = {
  mutations: PropTypes.shape({
    editOrganizationMembership: PropTypes.func.isRequired,
    resetUserPassword: PropTypes.func.isRequired
  }).isRequired,
  personData: PropTypes.object.isRequired,
  userData: PropTypes.object.isRequired,
  organizationData: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired
};

// TODO: use Fragment
const organizationFragment = `
  id
  peopleCount
  people(campaignId: $campaignId, offset: $offset) {
    id
    displayName
    email
    memberships(organizationId: $organizationId) {
      edges {
        node {
          id
          role
          requestAutoApprove
        }
      }
    }
  }
`;

const mutations = {
  editOrganizationMembership: ownProps => (
    membershipId,
    { level = null, role = null }
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
      membershipId: membershipId.toString(),
      level,
      role
    }
  }),
  resetUserPassword: ownProps => (organizationId, userId) => ({
    mutation: gql`
      mutation resetUserPassword($organizationId: String!, $userId: Int!) {
        resetUserPassword(organizationId: $organizationId, userId: $userId)
      }
    `,
    variables: {
      organizationId,
      userId
    }
  })
};

const queries = {
  personData: {
    query: gql`query getPeople($organizationId: String!, $campaignId: String, $offset: Int) {
      organization(id: $organizationId) {
        ${organizationFragment}
      }
    }`,
    options: ownProps => ({
      variables: {
        organizationId: ownProps.match.params.organizationId,
        campaignId: queryString.parse(ownProps.location.search).campaignId,
        offset:
          queryString.parse(ownProps.location.search).offset !== undefined
            ? queryString.parse(ownProps.location.search).offset * 200
            : 0
      },
      fetchPolicy: "cache-and-network"
    })
  },
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
    options: ownProps => ({
      variables: {
        organizationId: ownProps.match.params.organizationId
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
    options: ownProps => ({
      variables: {
        organizationId: ownProps.match.params.organizationId
      }
    })
  }
};

export default compose(
  withRouter,
  loadData({
    queries,
    mutations
  })
)(AdminPersonList);
