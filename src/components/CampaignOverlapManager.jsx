import React from "react";
import loadData from "../containers/hoc/load-data";
import wrapMutations from "../containers/hoc/wrap-mutations";
import CircularProgress from "material-ui/CircularProgress";
import gql from "graphql-tag";
import sortBy from "lodash/sortBy";
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn
} from "material-ui/Table";
import Snackbar from "material-ui/Snackbar";
import RaisedButton from "material-ui/RaisedButton";
import IconButton from "material-ui/IconButton";
import FlatButton from "material-ui/FlatButton";
import DeleteIcon from "material-ui/svg-icons/action/delete-forever";
import RefreshIcon from "material-ui/svg-icons/navigation/refresh";
import DataTable from "material-ui-datatables";
import moment from "moment";

const hoverBoxStyle = {
  position: "fixed",
  top: "120px",
  left: "50%",
  width: "400px",
  marginLeft: "-200px",
  backgroundColor: "#D0D0D0",
  padding: "20px"
};

const hoveredCampaignStyle = {
  padding: "10px",
  backgroundColor: "#F0F0F0"
};

class CampaignOverlapManager extends React.Component {
  state = {
    selectedCampaignIds: new Set(),
    deleting: new Set(),
    errored: new Set(),
    deleteResults: {},
    hoveredRowId: undefined,
    page: 0,
    pageSize: 10
  };

  deleteCampaign = async campaignId => {
    const { deleting, errored, deleteResults } = this.state;

    errored.delete(campaignId);
    deleting.add(campaignId);

    this.setState({ deleting, errored });

    try {
      const response = await this.props.mutations.deleteCampaignOverlap(
        campaignId
      );
      if (response.errors) throw new Error(response.errors);

      const {
        deletedRowCount,
        remainingCount
      } = response.data.deleteCampaignOverlap;
      const timestamp = new Date().getTime();
      deleteResults[campaignId] = {
        id: campaignId,
        deletedRowCount,
        remainingCount,
        timestamp
      };
      this.setState({ deleteResults });
    } catch (exc) {
      errored.add(campaignId);
    } finally {
      deleting.delete(campaignId);
      this.setState({ deleting, errored });
    }
  };

  handleOnDeleteCampaign = id => _ev => this.deleteCampaign(id);

  handleOnRowMouseOver = hoveredRowId => () => this.setState({ hoveredRowId });

  handleOnRowMouseOut = () => this.setState({ hoveredRowId: undefined });

  clearDeleteResult = id => () => {
    const { deleteResults } = this.state;
    delete deleteResults[id];
    this.setState({ deleteResults });
  };

  isRowSelected = campaignId => this.state.selectedCampaignIds.has(campaignId);

  handleDeleteAllSelected = async () => {
    const { selectedCampaignIds } = this.state;
    this.setState({ selectedCampaignIds: new Set() });
    await Promise.all([...selectedCampaignIds].map(this.deleteCampaign));
  };

  incrementPage = () => {
    this.setState({ page: this.state.page + 1 });
  };

  decrementPage = () => {
    this.setState({ page: Math.max(this.state.page - 1, 0) });
  };

  handleRowsSelected = (rows, secondParam) => {
    const currentPage = this.getOverlapPage(
      this.state.page,
      this.state.pageSize,
      this.state.search
    );

    const newSelectedCampaignIds = new Set([...this.state.selectedCampaignIds]);

    if (rows === "all") {
      new Array(this.state.pageSize)
        .fill(null)
        .map((_, idx) => idx)
        .forEach(idx =>
          newSelectedCampaignIds.add(currentPage[idx].campaignId)
        );
    }

    if (rows === "none") {
      new Array(this.state.pageSize)
        .fill(null)
        .map((_, idx) => idx)
        .forEach(idx =>
          newSelectedCampaignIds.delete(currentPage[idx].campaignId)
        );
    }

    if (Array.isArray(rows)) {
      // Add current elements
      for (const row of rows) {
        newSelectedCampaignIds.add(currentPage[row].campaignId);
      }

      // Remove things not present
      currentPage.forEach((o, idx) => {
        if (!rows.includes(idx)) {
          newSelectedCampaignIds.delete(o.campaignId);
        }
      });
    }

    this.setState({
      selectedCampaignIds: newSelectedCampaignIds
    });
  };

  getOverlapPage = (page, pageSize, search) =>
    (search
      ? this.props.fetchCampaignOverlaps.fetchCampaignOverlaps.filter(
          overlap => {
            return overlap.campaign.title.match(search);
          }
        )
      : this.props.fetchCampaignOverlaps.fetchCampaignOverlaps
    )
      .slice(page * pageSize, (page + 1) * pageSize)
      .map(overlap => ({
        campaignId: overlap.campaign.id,
        campaignTitle: overlap.campaign.title,
        overlapCount: overlap.overlapCount,
        lastActivity: moment(overlap.lastActivity).fromNow()
      }));

  render() {
    const { fetchCampaignOverlaps: overlaps } = this.props;
    const {
      deleting,
      errored,
      hoveredRowId,
      deleteResults,
      selectedCampaignIds,
      page,
      pageSize,
      search
    } = this.state;

    const isDeleteAllDisabled = selectedCampaignIds.size === 0;

    if (overlaps.loading && !overlaps.fetchCampaignOverlaps)
      return <CircularProgress />;

    const { fetchCampaignOverlaps: overlapList } = overlaps;
    const sortedDeleteResults = sortBy(
      Object.values(deleteResults),
      "timestamp"
    );

    const currentOverlapPage = this.getOverlapPage(page, pageSize, search);
    const selectedRows = currentOverlapPage
      .map(
        (_, idx) =>
          this.state.selectedCampaignIds.has(currentOverlapPage[idx].campaignId)
            ? idx
            : false
      )
      .filter(idxOrFalse => idxOrFalse !== false);

    return (
      <div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <p>
            Warning: clicking the trashcan will trigger an irreversible delete.
          </p>
          <div style={{ flexGrow: 1 }} />
          <RaisedButton
            label={
              isDeleteAllDisabled
                ? "Delete Selected"
                : `Delete ${selectedCampaignIds.size} Selected`
            }
            secondary={true}
            disabled={isDeleteAllDisabled}
            onClick={this.handleDeleteAllSelected}
          />
        </div>
        <DataTable
          multiSelectable
          selectable
          enableSelectAll
          showCheckboxes
          data={currentOverlapPage}
          page={page + 1}
          count={this.props.fetchCampaignOverlaps.fetchCampaignOverlaps.length}
          selectedRows={selectedRows}
          onRowSelection={this.handleRowsSelected}
          onNextPageClick={this.incrementPage}
          onPreviousPageClick={this.decrementPage}
          columns={[
            {
              key: "overlapCount",
              label: "Overlap Count",
              style: { width: 50 }
            },
            { key: "campaignId", label: "ID", style: { width: 30 } },
            {
              key: "lastActivity",
              label: "Last Messaged",
              style: { width: 50 }
            },
            { key: "campaignTitle", label: "Title" }
          ]}
        />

        {sortedDeleteResults.map(({ id, deletedRowCount, remainingCount }) => {
          const remainingText =
            remainingCount > 0
              ? `; skipped ${remainingCount} contacts that had already been messaged`
              : "";
          return (
            <Snackbar
              key={id}
              open={true}
              message={`From campaign [${id}]: deleted ${deletedRowCount}${remainingText}.`}
              autoHideDuration={4000}
              onRequestClose={this.clearDeleteResult(id)}
            />
          );
        })}
      </div>
    );
  }
}

const mapQueriesToProps = ({ ownProps }) => ({
  fetchCampaignOverlaps: {
    query: gql`
      query fetchCampaignOverlaps(
        $organizationId: String!
        $campaignId: String!
      ) {
        fetchCampaignOverlaps(
          organizationId: $organizationId
          campaignId: $campaignId
        ) {
          campaign {
            id
            title
          }
          overlapCount
          lastActivity
        }
      }
    `,
    variables: {
      campaignId: ownProps.campaignId,
      organizationId: ownProps.organizationId
    }
  }
});

const mapMutationsToProps = ({ ownProps }) => ({
  deleteCampaignOverlap: overlappingCampaignId => ({
    mutation: gql`
      mutation deleteCampaignOverlap(
        $organizationId: String!
        $campaignId: String!
        $overlappingCampaignId: String!
      ) {
        deleteCampaignOverlap(
          organizationId: $organizationId
          campaignId: $campaignId
          overlappingCampaignId: $overlappingCampaignId
        ) {
          campaign {
            id
          }
          deletedRowCount
          remainingCount
        }
      }
    `,
    variables: {
      organizationId: ownProps.organizationId,
      campaignId: ownProps.campaignId,
      overlappingCampaignId
    },
    refetchQueries: ["fetchCampaignOverlaps"]
  })
});

export default loadData(wrapMutations(CampaignOverlapManager), {
  mapQueriesToProps,
  mapMutationsToProps
});
