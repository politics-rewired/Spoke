import gql from "graphql-tag";
import { TextField, Toggle } from "material-ui";
import Dialog from "material-ui/Dialog";
import DropDownMenu from "material-ui/DropDownMenu";
import FloatingActionButton from "material-ui/FloatingActionButton";
import { MenuItem } from "material-ui/Menu";
import RaisedButton from "material-ui/RaisedButton";
import ContentAdd from "material-ui/svg-icons/content/add";
import PropTypes from "prop-types";
import React from "react";
import { compose } from "react-apollo";
import { withRouter } from "react-router";

import { withAuthzContext } from "../components/AuthzProvider";
import LoadingIndicator from "../components/LoadingIndicator";
import { dataTest } from "../lib/attributes";
import theme from "../styles/theme";
import CampaignList from "./CampaignList";
import { loadData } from "./hoc/with-operations";

const styles = {
  flexContainer: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    padding: 5
  }
};

const DEFAULT_PAGE_SIZE = 50;

class AdminCampaignList extends React.Component {
  state = {
    isCreating: false,
    pageSize: DEFAULT_PAGE_SIZE,
    currentPageIndex: 0,
    totalResults: undefined,
    campaignsFilter: {
      isArchived: false
    },
    releasingInProgress: false,
    releasingAllReplies: false,
    releaseAllRepliesError: undefined,
    releaseAllRepliesResult: undefined
  };

  handleClickNewButton = async () => {
    const { history, match } = this.props;
    const { organizationId } = match.params;
    this.setState({ isCreating: true });
    const newCampaign = await this.props.mutations.createCampaign({
      title: "New Campaign",
      description: "",
      dueBy: null,
      organizationId,
      contacts: [],
      interactionSteps: {
        scriptOptions: [""]
      }
    });
    if (newCampaign.errors) {
      alert("There was an error creating your campaign");
      throw new Error(newCampaign.errors);
    }

    const { id: campaignId } = newCampaign.data.createCampaign;
    history.push(
      `/admin/${organizationId}/campaigns/${campaignId}/edit?new=true`
    );
  };

  handleFilterChange = (event, index, value) => {
    this.setState({
      currentPageIndex: 0,
      pageSize: DEFAULT_PAGE_SIZE,
      campaignsFilter: {
        isArchived: value
      }
    });
  };

  handlePageSizeChange = (event, index, pageSize) => {
    this.setState({
      currentPageIndex: 0,
      pageSize
    });
  };

  onCurrentPageChange = (event, index, currentPageIndex) => {
    this.setState({ currentPageIndex });
  };

  startReleasingAllReplies = () => {
    this.setState({ releasingAllReplies: true });
  };

  closeReleasingAllReplies = () => {
    this.setState({
      releasingInProgress: false,
      releasingAllReplies: false,
      releaseAllRepliesError: undefined,
      releaseAllRepliesResult: undefined
    });
  };

  releaseAllReplies = () => {
    const ageInHours = this.refs.numberOfHoursToRelease.input.value;
    const releaseOnRestricted = this.refs.releaseOnRestricted.state.switched;
    const limitToCurrentlyTextableContacts = this.refs
      .limitToCurrentlyTextableContacts.state.switched;

    this.setState({ releasingInProgress: true });

    this.props.mutations
      .releaseAllUnhandledReplies(
        this.props.match.params.organizationId,
        ageInHours,
        releaseOnRestricted,
        limitToCurrentlyTextableContacts
      )
      .then((result) => {
        if (result.errors) {
          throw result.errors;
        }

        this.setState({
          releaseAllRepliesResult: result.data.releaseAllUnhandledReplies,
          releasingInProgress: false
        });
      })
      .catch((error) => {
        this.setState({
          releaseAllRepliesError: error,
          releasingInProgress: false
        });
      });
  };

  renderPageSizeOptions() {
    return (
      <DropDownMenu
        value={this.state.pageSize}
        onChange={this.handlePageSizeChange}
      >
        <MenuItem value={10} primaryText="10" />
        <MenuItem value={25} primaryText="25" />
        <MenuItem value={50} primaryText="50" />
        <MenuItem value={100} primaryText="100" />
        <MenuItem value={0} primaryText="All" />
      </DropDownMenu>
    );
  }

  renderPagesDropdown() {
    const { pageSize, currentPageIndex, totalResults } = this.state;

    const didFetchAll = pageSize === 0;
    const hasResults = totalResults && totalResults > 0;
    if (didFetchAll || !hasResults) {
      return "N/A";
    }

    const pageCount = Math.ceil(totalResults / pageSize);
    const pageArray = [...Array(pageCount)].map((_, i) => i);
    return (
      <DropDownMenu
        value={currentPageIndex}
        onChange={this.onCurrentPageChange}
      >
        {pageArray.map((pageIndex) => (
          <MenuItem
            key={pageIndex}
            value={pageIndex}
            primaryText={pageIndex + 1}
          />
        ))}
      </DropDownMenu>
    );
  }

  renderFilters() {
    return (
      <DropDownMenu
        value={this.state.campaignsFilter.isArchived}
        onChange={this.handleFilterChange}
      >
        <MenuItem value={false} primaryText="Current" />
        <MenuItem value primaryText="Archived" />
      </DropDownMenu>
    );
  }

  render() {
    const {
      pageSize,
      currentPageIndex,
      campaignsFilter,
      releasingAllReplies,
      releasingInProgress
    } = this.state;

    const doneReleasingReplies =
      this.state.releaseAllRepliesResult || this.state.releaseAllRepliesError;

    const { organizationId } = this.props.match.params;
    const { adminPerms } = this.props;
    return (
      <div>
        <div style={styles.flexContainer}>
          {this.renderFilters()}
          Page Size:
          {this.renderPageSizeOptions()}
          Page: {this.renderPagesDropdown()}
          <RaisedButton onClick={this.startReleasingAllReplies} primary>
            Release All Unhandled Replies
          </RaisedButton>
        </div>
        {releasingAllReplies && (
          <Dialog
            title="Release All Unhandled Replies"
            modal={false}
            open
            onRequestClose={this.closeReleasingAllReplies}
            actions={
              releasingInProgress
                ? []
                : doneReleasingReplies
                ? [
                    <RaisedButton
                      label="Done"
                      onClick={this.closeReleasingAllReplies}
                    />
                  ]
                : [
                    <RaisedButton
                      label="Cancel"
                      onClick={this.closeReleasingAllReplies}
                    />,
                    <RaisedButton
                      label="Release"
                      onClick={this.releaseAllReplies}
                      primary
                    />
                  ]
            }
          >
            {releasingInProgress ? (
              <LoadingIndicator />
            ) : this.state.releaseAllRepliesError ? (
              <span>
                Error: {JSON.stringify(this.state.releaseAllRepliesError)}
              </span>
            ) : this.state.releaseAllRepliesResult ? (
              <span>
                Released {this.state.releaseAllRepliesResult.contactCount}{" "}
                replies on {this.state.releaseAllRepliesResult.campaignCount}{" "}
                campaigns
              </span>
            ) : !doneReleasingReplies ? (
              <div>
                How many hours ago should a conversation have been idle for it
                to be unassigned?
                <TextField
                  type="number"
                  floatingLabelText="Number of Hours"
                  ref="numberOfHoursToRelease"
                  defaultValue={1}
                />
                <br />
                <br />
                Should we release replies on campaigns that are restricted to
                teams? If unchecked, replies on campaigns restricted to team
                members will stay assigned to their current texter.
                <Toggle ref="releaseOnRestricted" defaultToggled={false} />
                <br />
                <br />
                Release contacts only if it is within texting hours in the
                contact's timezone? If unchecked, replies will be released for
                contacts that may not be textable until later today or until
                tomorrow.
                <Toggle ref="limitToCurrentlyTextableContacts" defaultToggled />
              </div>
            ) : (
              <div />
            )}
          </Dialog>
        )}
        {this.state.isCreating ? (
          <LoadingIndicator />
        ) : (
          <CampaignList
            organizationId={organizationId}
            campaignsFilter={campaignsFilter}
            pageSize={pageSize}
            resultCountDidUpdate={(totalResults) =>
              this.setState({ totalResults })
            }
            currentPageIndex={currentPageIndex}
            adminPerms={adminPerms}
          />
        )}

        {adminPerms ? (
          <FloatingActionButton
            {...dataTest("addCampaign")}
            style={theme.components.floatingButton}
            onTouchTap={this.handleClickNewButton}
          >
            <ContentAdd />
          </FloatingActionButton>
        ) : null}
      </div>
    );
  }
}

AdminCampaignList.propTypes = {
  match: PropTypes.object,
  history: PropTypes.object,
  mutations: PropTypes.object,
  adminPerms: PropTypes.bool.isRequired
};

const mutations = {
  createCampaign: (ownProps) => (campaign) => ({
    mutation: gql`
      mutation createBlankCampaign($campaign: CampaignInput!) {
        createCampaign(campaign: $campaign) {
          id
        }
      }
    `,
    variables: { campaign }
  }),
  releaseAllUnhandledReplies: (ownProps) => (
    organizationId,
    ageInHours,
    releaseOnRestricted,
    limitToCurrentlyTextableContacts
  ) => ({
    mutation: gql`
      mutation releaseAllUnhandledReplies(
        $organizationId: String!
        $ageInHours: Float
        $releaseOnRestricted: Boolean
        $limitToCurrentlyTextableContacts: Boolean
      ) {
        releaseAllUnhandledReplies(
          organizationId: $organizationId
          ageInHours: $ageInHours
          releaseOnRestricted: $releaseOnRestricted
          limitToCurrentlyTextableContacts: $limitToCurrentlyTextableContacts
        ) {
          contactCount
          campaignCount
        }
      }
    `,
    variables: {
      organizationId,
      ageInHours,
      releaseOnRestricted,
      limitToCurrentlyTextableContacts
    }
  })
};

export default compose(
  withRouter,
  withAuthzContext,
  loadData({ mutations })
)(AdminCampaignList);
