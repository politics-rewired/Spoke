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

  renderCopyButton() {
    return (
      <RaisedButton
        label="Copy Campaign"
        onTouchTap={async () =>
          await this.props.mutations.copyCampaign(
            this.props.match.params.campaignId
          )
        }
      />
    );
  }

  render() {
    const { data, match, adminPerms } = this.props;
    const { organizationId, campaignId } = match.params;
    const campaign = data.campaign;

    if (!campaign) {
      return <h1> Uh oh! Campaign {campaignId} doesn't seem to exist </h1>;
    }

    const currentExportJob = this.props.data.campaign.pendingJobs.filter(
      job => job.jobType === "export"
    )[0];
    const shouldDisableExport =
      this.state.disableExportButton || currentExportJob;

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
                      onTouchTap={() =>
                        this.props.history.push(
                          `/admin/${organizationId}/campaigns/${campaignId}/edit`
                        )
                      }
                      label="Edit"
                    />
                  ) : null}
                  {adminPerms
                    ? [
                        // Buttons for Admins (and not Supervolunteers)
                        // export
                        <RaisedButton
                          onTouchTap={async () => {
                            this.setState(
                              {
                                exportMessageOpen: true,
                                disableExportButton: true
                              },
                              () => {
                                this.setState({
                                  exportMessageOpen: true,
                                  disableExportButton: false
                                });
                              }
                            );
                            await this.props.mutations.exportCampaign(
                              campaignId
                            );
                          }}
                          label={exportLabel}
                          disabled={shouldDisableExport}
                        />, // unarchive
                        campaign.isArchived ? (
                          <RaisedButton
                            onTouchTap={async () =>
                              await this.props.mutations.unarchiveCampaign(
                                campaignId
                              )
                            }
                            label="Unarchive"
                          />
                        ) : null, // archive
                        !campaign.isArchived ? (
                          <RaisedButton
                            onTouchTap={async () =>
                              await this.props.mutations.archiveCampaign(
                                campaignId
                              )
                            }
                            label="Archive"
                          />
                        ) : null, // copy
                        <RaisedButton
                          label="Open Script Preview"
                          onTouchTap={() => {
                            window.open(
                              `/preview/${campaign.previewUrl}`,
                              "_blank"
                            );
                          }}
                        />,
                        <RaisedButton
                          {...dataTest("copyCampaign")}
                          label="Copy Campaign"
                          disabled={this.state.copyingCampaign}
                          onTouchTap={() => {
                            this.setState({ copyingCampaign: true });

                            this.props.mutations
                              .copyCampaign(this.props.match.params.campaignId)
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
      },
      pollInterval: 5000
    })
  }
};

const mutations = {
  archiveCampaign: ownProps => campaignId => ({
    mutation: gql`
      mutation archiveCampaign($campaignId: String!) {
        archiveCampaign(id: $campaignId) {
          id
          isArchived
        }
      }
    `,
    variables: { campaignId }
  }),
  unarchiveCampaign: ownProps => campaignId => ({
    mutation: gql`
      mutation unarchiveCampaign($campaignId: String!) {
        unarchiveCampaign(id: $campaignId) {
          id
          isArchived
        }
      }
    `,
    variables: { campaignId }
  }),
  exportCampaign: ownProps => campaignId => ({
    mutation: gql`
      mutation exportCampaign($campaignId: String!) {
        exportCampaign(id: $campaignId) {
          id
        }
      }
    `,
    variables: { campaignId }
  }),
  copyCampaign: ownProps => campaignId => ({
    mutation: gql`
      mutation copyCampaign($campaignId: String!) {
        copyCampaign(id: $campaignId) {
          id
        }
      }
    `,
    variables: { campaignId }
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
