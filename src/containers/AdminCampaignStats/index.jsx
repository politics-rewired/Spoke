import { gql } from "@apollo/client";
import { red } from "@material-ui/core/colors";
import Grid from "@material-ui/core/Grid";
import { css, StyleSheet } from "aphrodite";
import Divider from "material-ui/Divider";
import RaisedButton from "material-ui/RaisedButton";
import Snackbar from "material-ui/Snackbar";
import PropTypes from "prop-types";
import React from "react";
import { Helmet } from "react-helmet";
import { withRouter } from "react-router-dom";
import { compose } from "recompose";

import { withAuthzContext } from "../../components/AuthzProvider";
import CampaignNavigation from "../../components/CampaignNavigation";
import { dataTest } from "../../lib/attributes";
import { DateTime } from "../../lib/datetime";
import theme from "../../styles/theme";
import { loadData } from "../hoc/with-operations";
import CampaignSurveyStats from "./CampaignSurveyStats";
import DeliverabilityStats from "./DeliverabilityStats";
import { GET_CAMPAIGN, GET_ORGANIZATION_DATA } from "./queries";
import TexterStats from "./TexterStats";
import TopLineStats from "./TopLineStats";
import VanExportModal from "./VanExportModal";
import VanSyncModal from "./VanSyncModal";

const styles = StyleSheet.create({
  container: {
    ...theme.layouts.multiColumn.container,
    marginBottom: 40,
    justifyContent: "space-around",
    flexWrap: "wrap"
  },
  buttonContainer: {
    ...theme.layouts.multiColumn.container,
    justifyContent: "flex-end",
    paddingTop: 20,
    paddingBottom: 20,
    flexWrap: "wrap"
  },
  archivedBanner: {
    backgroundColor: "#FFFBE6",
    fontSize: "16px",
    width: "100%",
    padding: "15px",
    textAlign: "center",
    marginBottom: "20px"
  },
  header: {
    ...theme.text.header
  },
  flexColumn: {
    flex: 1,
    textAlign: "right",
    display: "flex"
  },
  rightAlign: {
    marginLeft: "auto",
    marginRight: 0
  },
  inline: {
    display: "inline-block",
    marginLeft: 20,
    verticalAlign: "middle"
  },
  secondaryHeader: {
    ...theme.text.secondaryHeader
  }
});

class AdminCampaignStats extends React.Component {
  state = {
    exportMessageOpen: false,
    exportVanOpen: false,
    syncVanOpen: false,
    disableExportButton: false,
    disableVanExportButton: false,
    disableVanSyncButton: false,
    copyingCampaign: false,
    campaignJustCopied: false,
    copiedCampaignId: undefined,
    copyCampaignError: undefined
  };

  handleNavigateToEdit = () => {
    const { organizationId, campaignId } = this.props.match.params;
    const editUrl = `/admin/${organizationId}/campaigns/${campaignId}/edit`;
    this.props.history.push(editUrl);
  };

  handleOnClickExport = async () => {
    this.setState({
      exportMessageOpen: true,
      disableExportButton: true
    });
    await this.props.mutations.exportCampaign();
  };

  handleOnClickVanExport = () => this.setState({ exportVanOpen: true });

  handleDismissVanExport = () => this.setState({ exportVanOpen: false });

  handleCompleteVanExport = () =>
    this.setState({
      exportVanOpen: false,
      exportMessageOpen: true,
      disableVanExportButton: true
    });

  handleOnClickVanSync = () => this.setState({ syncVanOpen: true });

  handleDismissVanSync = () => this.setState({ syncVanOpen: false });

  handleCompleteVanSync = () =>
    this.setState({
      syncVanOpen: false,
      disableVanSyncButton: true
    });

  prevCampaignClicked = (campaignId) => {
    const { history } = this.props;
    const { organizationId } = this.props.match.params;
    history.push(`/admin/${organizationId}/campaigns/${campaignId}`);
  };

  nextCampaignClicked = (campaignId) => {
    const { history } = this.props;
    const { organizationId } = this.props.match.params;
    history.push(`/admin/${organizationId}/campaigns/${campaignId}`);
  };

  render() {
    const {
      disableExportButton,
      disableVanExportButton,
      disableVanSyncButton
    } = this.state;
    const { data, match, isAdmin } = this.props;
    const { organizationId, campaignId } = match.params;
    const { campaign } = data;
    const { pendingJobs } = campaign;

    if (!campaign) {
      return <h1> Uh oh! Campaign {campaignId} doesn't seem to exist </h1>;
    }

    const currentExportJob = pendingJobs.find(
      (job) => job.jobType === "export"
    );
    const shouldDisableExport =
      disableExportButton || currentExportJob !== undefined;
    const exportLabel = currentExportJob
      ? `Exporting (${currentExportJob.status}%)`
      : "Export Data";

    const vanExportJob = pendingJobs.find(
      (job) => job.jobType === "van-export"
    );
    const isVanExportDisabled =
      disableVanExportButton || vanExportJob !== undefined;
    const vanExportLabel = vanExportJob
      ? `Exporting for VAN (${vanExportJob.status}%)`
      : "Export for VAN";

    const vanSyncJob = pendingJobs.find((job) => job.jobType === "van-sync");
    const isVanSyncDisabled = disableVanSyncButton || vanSyncJob !== undefined;
    const vanSyncLabel = vanSyncJob
      ? `Syncing to VAN (${vanSyncJob.status}%)`
      : "Sync to VAN";

    const dueFormatted = campaign.dueBy
      ? DateTime.fromISO(campaign.dueBy).toFormat("DD")
      : "No Due Date";
    const isOverdue = DateTime.local() >= DateTime.fromISO(campaign.dueBy);

    const newTitle = `${this.props.organizationData.organization.name} - Campaigns - ${campaignId}: ${campaign.title}`;

    return (
      <div>
        <Helmet>
          <title>{newTitle}</title>
        </Helmet>
        <Grid container justify="flex-end">
          <Grid item>
            <CampaignNavigation
              prevCampaignClicked={this.prevCampaignClicked}
              nextCampaignClicked={this.nextCampaignClicked}
              campaignId={campaign.id}
            />
          </Grid>
        </Grid>
        <Divider style={{ marginTop: 20, marginBottom: 20 }} />
        <div className={css(styles.container)}>
          {campaign.isArchived ? (
            <div className={css(styles.archivedBanner)}>
              This campaign is archived
            </div>
          ) : (
            ""
          )}

          <div className={css(styles.header)}>
            {campaign.title}
            <br />
            Campaign ID: {campaign.id}
            <br />
            Due:{" "}
            <span style={{ color: isOverdue ? red[600] : undefined }}>
              {dueFormatted} {isOverdue && "(Overdue)"}
            </span>
          </div>
          <div className={css(styles.flexColumn)}>
            <div className={css(styles.rightAlign)}>
              <div className={css(styles.inline)}>
                <div className={css(styles.inline)}>
                  {!campaign.isArchived ? (
                    // edit
                    <RaisedButton
                      {...dataTest("editCampaign")}
                      onClick={this.handleNavigateToEdit}
                      label="Edit"
                    />
                  ) : null}
                  {isAdmin
                    ? [
                        // Buttons for Admins (and not Supervolunteers)
                        // export
                        <RaisedButton
                          key="export"
                          onClick={this.handleOnClickExport}
                          label={exportLabel}
                          disabled={shouldDisableExport}
                        />,
                        // Export for VAN
                        <RaisedButton
                          key="van-export"
                          label={vanExportLabel}
                          disabled={isVanExportDisabled}
                          onClick={this.handleOnClickVanExport}
                        />,
                        // Sync to VAN
                        <RaisedButton
                          key="van-sync"
                          label={vanSyncLabel}
                          disabled={isVanSyncDisabled}
                          onClick={this.handleOnClickVanSync}
                        />,
                        // unarchive
                        campaign.isArchived ? (
                          <RaisedButton
                            key="unarchive"
                            onClick={() =>
                              this.props.mutations.unarchiveCampaign()
                            }
                            label="Unarchive"
                          />
                        ) : null, // archive
                        !campaign.isArchived ? (
                          <RaisedButton
                            key="archive"
                            onClick={() =>
                              this.props.mutations.archiveCampaign()
                            }
                            label="Archive"
                          />
                        ) : null,
                        // Open script preview
                        <RaisedButton
                          key="open-script-preview"
                          label="Open Script Preview"
                          onClick={() => {
                            window.open(
                              `/preview/${campaign.previewUrl}`,
                              "_blank"
                            );
                          }}
                        />,
                        // Copy
                        <RaisedButton
                          key="copy"
                          {...dataTest("copyCampaign")}
                          label="Copy Campaign"
                          disabled={this.state.copyingCampaign}
                          onClick={() => {
                            this.setState({ copyingCampaign: true });

                            this.props.mutations
                              .copyCampaign()
                              .then((result) => {
                                if (result.errors) {
                                  throw result.errors;
                                }

                                this.setState({
                                  campaignJustCopied: true,
                                  copyingCampaign: false,
                                  copiedCampaignId: result.data.copyCampaign.id
                                });
                              })
                              .catch((error) =>
                                this.setState({
                                  campaignJustCopied: true,
                                  copyingCampaign: false,
                                  copyCampaignError: error
                                })
                              );
                          }}
                        />
                      ]
                    : null}
                </div>
              </div>
            </div>
          </div>
        </div>
        <TopLineStats campaignId={campaign.id} />
        <div className={css(styles.header)}>Survey Questions</div>
        <CampaignSurveyStats campaignId={campaign.id} />

        <br />
        <div className={css(styles.header)}>Outbound Deliverability</div>
        <DeliverabilityStats campaignId={campaign.id} />
        <br />

        <div className={css(styles.header)}>Texter stats</div>
        <div className={css(styles.secondaryHeader)}>% of first texts sent</div>
        <TexterStats campaignId={campaign.id} />

        <Snackbar
          open={this.state.exportMessageOpen}
          message="Export started - we'll e-mail you when it's done"
          autoHideDuration={5000}
          onRequestClose={() => {
            this.setState({ exportMessageOpen: false });
          }}
        />
        <Snackbar
          open={this.state.campaignJustCopied}
          message={
            this.state.copyCampaignError
              ? `Error: ${this.state.copyCampaignError}`
              : `Campaign successfully copied to campaign ${this.state.copiedCampaignId}`
          }
          autoHideDuration={5000}
          onRequestClose={() => {
            this.setState({
              campaignJustCopied: false,
              copiedCampaignId: undefined,
              copyCampaignError: undefined
            });
          }}
        />
        <VanExportModal
          campaignId={campaignId}
          open={this.state.exportVanOpen}
          onRequestClose={this.handleDismissVanExport}
          onComplete={this.handleCompleteVanExport}
        />
        <VanSyncModal
          organizationId={organizationId}
          campaignId={campaignId}
          open={this.state.syncVanOpen}
          onRequestClose={this.handleDismissVanSync}
          onComplete={this.handleCompleteVanSync}
        />
      </div>
    );
  }
}

AdminCampaignStats.propTypes = {
  mutations: PropTypes.object,
  data: PropTypes.object,
  match: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  isAdmin: PropTypes.bool.isRequired
};

const queries = {
  data: {
    query: GET_CAMPAIGN,
    options: (ownProps) => ({
      variables: {
        campaignId: ownProps.match.params.campaignId
      }
    })
  },

  organizationData: {
    query: GET_ORGANIZATION_DATA,
    options: (ownProps) => ({
      variables: {
        organizationId: ownProps.match.params.organizationId
      }
    })
  }
};

const mutations = {
  archiveCampaign: (ownProps) => () => ({
    mutation: gql`
      mutation archiveCampaign($campaignId: String!) {
        archiveCampaign(id: $campaignId) {
          id
          isArchived
        }
      }
    `,
    variables: { campaignId: ownProps.match.params.campaignId }
  }),
  unarchiveCampaign: (ownProps) => () => ({
    mutation: gql`
      mutation unarchiveCampaign($campaignId: String!) {
        unarchiveCampaign(id: $campaignId) {
          id
          isArchived
        }
      }
    `,
    variables: { campaignId: ownProps.match.params.campaignId }
  }),
  exportCampaign: (ownProps) => () => ({
    mutation: gql`
      mutation exportCampaign($campaignId: String!) {
        exportCampaign(
          options: { campaignId: $campaignId, exportType: SPOKE }
        ) {
          id
        }
      }
    `,
    variables: { campaignId: ownProps.match.params.campaignId }
  }),
  copyCampaign: (ownProps) => () => ({
    mutation: gql`
      mutation copyCampaign($campaignId: String!) {
        copyCampaign(id: $campaignId) {
          id
        }
      }
    `,
    variables: { campaignId: ownProps.match.params.campaignId }
  })
};

export default compose(
  withRouter,
  withAuthzContext,
  loadData({
    queries,
    mutations
  })
)(AdminCampaignStats);
