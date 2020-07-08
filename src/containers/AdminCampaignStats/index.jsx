import PropTypes from "prop-types";
import React from "react";
import moment from "moment";
import gql from "graphql-tag";
import { withRouter } from "react-router";
import { compose } from "react-apollo";
import { StyleSheet, css } from "aphrodite";

import RaisedButton from "material-ui/RaisedButton";
import Snackbar from "material-ui/Snackbar";
import { red600 } from "material-ui/styles/colors";

import { withAuthzContext } from "../../components/AuthzProvider";
import { loadData } from "../hoc/with-operations";
import theme from "../../styles/theme";
import { dataTest } from "../../lib/attributes";
import TopLineStats from "./TopLineStats";
import CampaignSurveyStats from "./CampaignSurveyStats";
import TexterStats from "./TexterStats";

const styles = StyleSheet.create({
  container: {
    ...theme.layouts.multiColumn.container,
    marginBottom: 40,
    justifyContent: "space-around",
    flexWrap: "wrap"
  },
  archivedBanner: {
    backgroundColor: "#FFFBE6",
    fontSize: "16px",
    fontWeight: "bold",
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
    disableExportButton: false,
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

  render() {
    const { disableExportButton } = this.state;
    const { data, match, adminPerms } = this.props;
    const { organizationId, campaignId } = match.params;
    const campaign = data.campaign;
    const { pendingJobs } = campaign;

    if (!campaign) {
      return <h1> Uh oh! Campaign {campaignId} doesn't seem to exist </h1>;
    }

    const currentExportJob = pendingJobs.find(job => job.jobType === "export");
    const shouldDisableExport =
      disableExportButton || currentExportJob !== undefined;
    const exportLabel = currentExportJob
      ? `Exporting (${currentExportJob.status}%)`
      : "Export Data";

    const dueFormatted = moment(campaign.dueBy).format("MMM D, YYYY");
    const isOverdue = moment().isSameOrAfter(campaign.dueBy);

    return (
      <div>
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
            <span style={{ color: isOverdue ? red600 : undefined }}>
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
                  {adminPerms
                    ? [
                        // Buttons for Admins (and not Supervolunteers)
                        // export
                        <RaisedButton
                          key="export"
                          onClick={this.handleOnClickExport}
                          label={exportLabel}
                          disabled={shouldDisableExport}
                        />,
                        // unarchive
                        campaign.isArchived ? (
                          <RaisedButton
                            key="unarchive"
                            onTouchTap={async () =>
                              await this.props.mutations.unarchiveCampaign()
                            }
                            label="Unarchive"
                          />
                        ) : null, // archive
                        !campaign.isArchived ? (
                          <RaisedButton
                            key="archive"
                            onTouchTap={async () =>
                              await this.props.mutations.archiveCampaign()
                            }
                            label="Archive"
                          />
                        ) : null,
                        // Open script preview
                        <RaisedButton
                          key="open-script-preview"
                          label="Open Script Preview"
                          onTouchTap={() => {
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
                          onTouchTap={() => {
                            this.setState({ copyingCampaign: true });

                            this.props.mutations
                              .copyCampaign()
                              .then(result => {
                                if (result.errors) {
                                  throw result.errors;
                                }

                                this.setState({
                                  campaignJustCopied: true,
                                  copyingCampaign: false,
                                  copiedCampaignId: result.data.copyCampaign.id
                                });
                              })
                              .catch(error =>
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
              : `Campaign successfully copied to campaign ${
                  this.state.copiedCampaignId
                }`
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
      </div>
    );
  }
}

AdminCampaignStats.propTypes = {
  mutations: PropTypes.object,
  data: PropTypes.object,
  match: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  adminPerms: PropTypes.bool.isRequired
};

const queries = {
  data: {
    query: gql`
      query getCampaign($campaignId: String!) {
        campaign(id: $campaignId) {
          id
          title
          dueBy
          isArchived
          useDynamicAssignment
          pendingJobs {
            id
            jobType
            assigned
            status
          }
          previewUrl
        }
      }
    `,
    options: ownProps => ({
      variables: {
        campaignId: ownProps.match.params.campaignId
      }
    })
  }
};

const mutations = {
  archiveCampaign: ownProps => () => ({
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
  unarchiveCampaign: ownProps => () => ({
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
  exportCampaign: ownProps => () => ({
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
  copyCampaign: ownProps => () => ({
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
