import PropTypes from "prop-types";
import React from "react";
import gql from "graphql-tag";
import moment from "moment";

import DataTable from "material-ui-datatables";
import CircularProgress from "material-ui/CircularProgress";
import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
import RaisedButton from "material-ui/RaisedButton";
import TextField from "material-ui/TextField";

import { loadData } from "../../hoc/with-operations";
import SectionWrapper from "../components/SectionWrapper";

const ROW_SIZE_OPTIONS = [25, 50, 100];

export const SECTION_OPTIONS = {
  blockStarting: false,
  expandAfterCampaignStarts: true,
  expandableBySuperVolunteers: false
};

class CampaignOverlapManager extends React.Component {
  state = {
    selectedCampaignIds: new Set(),
    deleted: new Set(),
    deleting: new Set(),
    error: undefined,
    page: 0,
    pageSize: 25,
    search: ""
  };

  handleDeleteAllSelected = async () => {
    const { deleteManyCampaignOverlap } = this.props.mutations;
    const { selectedCampaignIds } = this.state;
    const newDeleting = new Set([...selectedCampaignIds]);
    this.setState({ deleting: newDeleting, selectedCampaignIds: new Set() });

    try {
      const response = await deleteManyCampaignOverlap([...newDeleting]);
      if (response.errors) throw new Error(response.errors);
      const deleted = new Set([...this.state.deleted].concat([...newDeleting]));
      this.setState({ deleted });
    } catch (err) {
      this.setState({ error: err.message });
    } finally {
      this.setState({ deleting: new Set() });
    }
  };

  incrementPage = () => this.setState({ page: this.state.page + 1 });
  decrementPage = () =>
    this.setState({ page: Math.max(this.state.page - 1, 0) });

  handleRowsSelected = rows => {
    const { page, pageSize, search, deleted, selectedCampaignIds } = this.state;
    const { overlapPage } = this.getOverlapPage(page, pageSize, search);

    const newSelectedCampaignIds = new Set([...selectedCampaignIds]);

    if (rows === "all") {
      new Array(pageSize)
        .fill(null)
        .map((_, idx) => idx)
        .forEach(idx => {
          if (overlapPage[idx]) {
            if (!deleted.has(overlapPage[idx].campaignId)) {
              newSelectedCampaignIds.add(overlapPage[idx].campaignId);
            }
          }
        });
    }

    if (rows === "none") {
      new Array(pageSize)
        .fill(null)
        .map((_, idx) => idx)
        .forEach(idx => {
          if (overlapPage[idx])
            newSelectedCampaignIds.delete(overlapPage[idx].campaignId);
        });
    }

    if (Array.isArray(rows)) {
      // Add current elements
      for (const row of rows) {
        if (!deleted.has(overlapPage[row].campaignId)) {
          newSelectedCampaignIds.add(overlapPage[row].campaignId);
        }
      }

      // Remove things not present
      overlapPage.forEach((o, idx) => {
        if (!rows.includes(idx)) {
          newSelectedCampaignIds.delete(o.campaignId);
        }
      });
    }

    this.setState({ selectedCampaignIds: newSelectedCampaignIds });
  };

  handleRowSizeChange = rowSizeIdx =>
    this.setState({ pageSize: ROW_SIZE_OPTIONS[rowSizeIdx] });

  getOverlapPage = (page, pageSize, search) => {
    search = new RegExp(search, "i");
    const { fetchCampaignOverlaps } = this.props.fetchCampaignOverlaps;
    const filteredOverlaps =
      search !== ""
        ? fetchCampaignOverlaps.filter(overlap =>
            overlap.campaign.title.match(search)
          )
        : fetchCampaignOverlaps;

    const overlapPage = filteredOverlaps
      .slice(page * pageSize, (page + 1) * pageSize)
      .map(overlap => ({
        campaignId: overlap.campaign.id,
        campaignTitle: overlap.campaign.title,
        overlapCount: overlap.overlapCount,
        lastActivity: moment(overlap.lastActivity).fromNow()
      }));

    return { overlapPage, totalCount: filteredOverlaps.length };
  };

  handleOverlapSearchChange = e =>
    this.setState({ search: e.target.value, page: 0 });

  handleDismissError = () => this.setState({ error: undefined });

  render() {
    const {
      active,
      adminPerms,
      jobs,
      onDiscardJob,
      onExpandChange
    } = this.props;
    const {
      error,
      deleting,
      deleted,
      selectedCampaignIds,
      page,
      pageSize,
      search
    } = this.state;

    const userHasPermissions =
      adminPerms || SECTION_OPTIONS.expandableBySuperVolunteers;
    const sectionCanExpand =
      SECTION_OPTIONS.expandAfterCampaignStarts || !isStarted;
    const expandable = sectionCanExpand && userHasPermissions;

    const isDeleteAllDisabled =
      selectedCampaignIds.size === 0 || deleting.size > 0;

    const { overlapPage, totalCount } = this.getOverlapPage(
      page,
      pageSize,
      search
    );
    const selectedRows = overlapPage
      .map(
        (overlap, idx) =>
          selectedCampaignIds.has(overlap.campaignId) ? idx : false
      )
      .filter(idxOrFalse => idxOrFalse !== false);

    // This section exists outside the usual campaign edit flow
    const isSaving = false;
    const sectionIsDone = true;

    const errorActions = [
      <FlatButton label="OK" primary={true} onClick={this.handleDismissError} />
    ];

    return (
      <SectionWrapper
        title="Contact Overlap Management"
        expandable={expandable}
        active={active}
        saving={isSaving}
        done={sectionIsDone}
        adminPerms={adminPerms}
        pendingJob={jobs[0]}
        onExpandChange={onExpandChange}
        onDiscardJob={onDiscardJob}
      >
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
          name="campaignTitle"
          fullWidth
          placeholder="Search for campaigns"
          onChange={this.handleOverlapSearchChange}
        />
        <DataTable
          multiSelectable
          selectable
          enableSelectAll
          showCheckboxes
          data={overlapPage}
          page={page + 1}
          count={totalCount}
          selectedRows={selectedRows}
          onRowSelection={this.handleRowsSelected}
          onRowSizeChange={this.handleRowSizeChange}
          rowSize={pageSize}
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
                    {title} <CircularProgress size={24} />
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
        <Dialog
          title="Error"
          open={error !== undefined}
          actions={errorActions}
          onRequestClose={this.handleDismissError}
        >
          {error || ""}
        </Dialog>
      </SectionWrapper>
    );
  }
}

CampaignOverlapManager.propTypes = {
  campaignId: PropTypes.string.isRequired,
  adminPerms: PropTypes.bool.isRequired,
  active: PropTypes.bool.isRequired,
  isNew: PropTypes.bool.isRequired,
  saveLabel: PropTypes.string.isRequired,
  jobs: PropTypes.arrayOf(PropTypes.object).isRequired,
  onExpandChange: PropTypes.func.isRequired,
  onDiscardJob: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,

  // HOC props
  mutations: PropTypes.shape({
    deleteManyCampaignOverlap: PropTypes.func.isRequired
  }).isRequired,
  fetchCampaignOverlaps: PropTypes.shape({
    fetchCampaignOverlaps: PropTypes.arrayOf(
      PropTypes.shape({
        campaign: PropTypes.shape({
          id: PropTypes.string.isRequired,
          title: PropTypes.string.isRequired
        }).isRequired,
        overlapCount: PropTypes.number.isRequired,
        lastActivity: PropTypes.any.isRequired
      })
    ).isRequired
  }).isRequired
};

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
  })
};

export default loadData({
  queries,
  mutations
})(CampaignOverlapManager);
