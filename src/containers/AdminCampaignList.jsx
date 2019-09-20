import PropTypes from "prop-types";
import React from "react";
import CampaignList from "./CampaignList";
import FloatingActionButton from "material-ui/FloatingActionButton";
import ContentAdd from "material-ui/svg-icons/content/add";
import loadData from "./hoc/load-data";
import { withRouter } from "react-router";
import gql from "graphql-tag";
import theme from "../styles/theme";
import LoadingIndicator from "../components/LoadingIndicator";
import wrapMutations from "./hoc/wrap-mutations";
import DropDownMenu from "material-ui/DropDownMenu";
import { MenuItem } from "material-ui/Menu";
import { dataTest } from "../lib/attributes";

const styles = {
  flexContainer: {
    display: "flex",
    alignItems: "baseline"
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
    }
  };

  handleClickNewButton = async () => {
    const { router, params } = this.props;
    const { organizationId } = params;
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
    router.push(
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
    const pageArray = Array.apply(null, { length: pageCount }).map(
      Number.call,
      Number
    );
    return (
      <DropDownMenu
        value={currentPageIndex}
        onChange={this.onCurrentPageChange}
      >
        {pageArray.map(pageIndex => (
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
    const { pageSize, currentPageIndex, campaignsFilter } = this.state;
    const { organizationId, adminPerms } = this.props.params;
    return (
      <div>
        <div style={styles.flexContainer}>
          {this.renderFilters()}
          Page Size:
          {this.renderPageSizeOptions()}
          Page: {this.renderPagesDropdown()}
        </div>
        {this.state.isCreating ? (
          <LoadingIndicator />
        ) : (
          <CampaignList
            organizationId={organizationId}
            campaignsFilter={campaignsFilter}
            pageSize={pageSize}
            resultCountDidUpdate={totalResults =>
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
  params: PropTypes.object,
  mutations: PropTypes.object,
  router: PropTypes.object
};

const mapMutationsToProps = () => ({
  createCampaign: campaign => ({
    mutation: gql`
      mutation createBlankCampaign($campaign: CampaignInput!) {
        createCampaign(campaign: $campaign) {
          id
        }
      }
    `,
    variables: { campaign }
  })
});

export default loadData(wrapMutations(withRouter(AdminCampaignList)), {
  mapMutationsToProps
});
