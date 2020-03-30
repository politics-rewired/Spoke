import React from "react";
import gql from "graphql-tag";
import moment from "moment";

import CircularProgress from "material-ui/CircularProgress";
import DataTable from "material-ui-datatables";
import RaisedButton from "material-ui/RaisedButton";

import { loadData } from "../../hoc/with-operations";
import LoadingIndicator from "../../../components/LoadingIndicator";
import { TextField } from "material-ui";

const ROW_SIZE_OPTIONS = [25, 50, 100];

class CampaignOverlapManager extends React.Component {
  state = {
    selectedCampaignIds: new Set(),
    deleted: new Set(),
    deleting: new Set(),
    errored: new Set(),
    hoveredRowId: undefined,
    page: 0,
    pageSize: 10,
    search: ""
  };

  deleteCampaigns = async campaignId => {
    try {
      const newDeleting = new Set();

      for (const id of this.state.selectedCampaignIds.values()) {
        newDeleting.add(id);
      }

      this.setState({ deleting: newDeleting, selectedCampaignIds: new Set() });

      const response = await this.props.mutations.deleteManyCampaignOverlap([
        ...this.state.selectedCampaignIds
      ]);

      if (response.errors) throw new Error(response.errors);

      this.setState({
        deleting: new Set(),
        deleted: new Set([...this.state.deleted].concat([...newDeleting]))
      });
    } catch (exc) {
      errored.add(campaignId);
    } finally {
      this.setState({ deleting: new Set(), errored });
    }
  };

  handleDeleteAllSelected = async () => {
    await this.deleteCampaigns();
  };

  incrementPage = () => {
    this.setState({ page: this.state.page + 1 });
  };

  decrementPage = () => {
    this.setState({ page: Math.max(this.state.page - 1, 0) });
  };

  handleRowsSelected = rows => {
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
        .forEach(idx => {
          if (currentPage[idx]) {
            if (!this.state.deleted.has(currentPage[idx].campaignId)) {
              newSelectedCampaignIds.add(currentPage[idx].campaignId);
            }
          }
        });
    }

    if (rows === "none") {
      new Array(this.state.pageSize)
        .fill(null)
        .map((_, idx) => idx)
        .forEach(idx => {
          if (currentPage[idx])
            newSelectedCampaignIds.delete(currentPage[idx].campaignId);
        });
    }

    if (Array.isArray(rows)) {
      // Add current elements
      for (const row of rows) {
        if (!this.state.deleted.has(currentPage[row].campaignId)) {
          newSelectedCampaignIds.add(currentPage[row].campaignId);
        }
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

  handleRowSizeChange = rowSizeIdx => {
    this.setState({ pageSize: ROW_SIZE_OPTIONS[rowSizeIdx] });
  };

  getOverlapPage = (page, pageSize, search) =>
    (search !== ""
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

  setOverlapSearch = e => {
    this.setState({ search: e.target.value });
  };

  render() {
    const { fetchCampaignOverlaps: overlaps } = this.props;
    const {
      deleting,
      deleted,
      selectedCampaignIds,
      page,
      pageSize,
      search
    } = this.state;

    const isDeleteAllDisabled =
      selectedCampaignIds.size === 0 || deleting.size > 0;

    if (overlaps.loading && !overlaps.fetchCampaignOverlaps)
      return <CircularProgress />;

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
              deleting.size > 0
                ? "Deleting..."
                : isDeleteAllDisabled
                  ? "Delete Selected"
                  : `Delete ${selectedCampaignIds.size} Selected`
            }
            secondary={true}
            disabled={isDeleteAllDisabled}
            onClick={this.handleDeleteAllSelected}
          />
        </div>
        <TextField
          fullWidth
          placeholder="Search for campaigns"
          onChange={this.setOverlapSearch}
        />
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
          onRowSizeChange={this.handleRowSizeChange}
          rowSize={this.state.pageSize}
          rowSizeList={ROW_SIZE_OPTIONS}
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
            {
              key: "campaignTitle",
              label: "Title",
              render: (title, { campaignId }) =>
                deleting.has(campaignId) ? (
                  <span>
                    {title} <LoadingIndicator />
                  </span>
                ) : deleted.has(campaignId) ? (
                  <span>
                    <strike> {title} </strike>
                  </span>
                ) : (
                  <span> {title} </span>
                )
            }
          ]}
        />

        {/* // TODO - bring back delete results */}
        {/* {sortedDeleteResults.map(({ id, deletedRowCount, remainingCount }) => {
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
        })} */}
      </div>
    );
  }
}

const queries = {
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
    options: ownProps => ({
      variables: {
        campaignId: ownProps.campaignId,
        organizationId: ownProps.organizationId
      }
    })
  }
};

const mutations = {
  deleteManyCampaignOverlap: ownProps => overlappingCampaignIds => ({
    mutation: gql`
      mutation deleteManyCampaignOverlap(
        $organizationId: String!
        $campaignId: String!
        $overlappingCampaignIds: [String]!
      ) {
        deleteManyCampaignOverlap(
          organizationId: $organizationId
          campaignId: $campaignId
          overlappingCampaignIds: $overlappingCampaignIds
        )
      }
    `,
    variables: {
      organizationId: ownProps.organizationId,
      campaignId: ownProps.campaignId,
      overlappingCampaignIds
    }
    // refetchQueries: ["fetchCampaignOverlaps"]
  })
};

export default loadData({
  queries,
  mutations
})(CampaignOverlapManager);
