import type { ApolloQueryResult } from "@apollo/client";
import { gql } from "@apollo/client";
import Button from "@material-ui/core/Button";
import { green, red } from "@material-ui/core/colors";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import type { Campaign, JobRequest } from "@spoke/spoke-codegen";
import type { History } from "history";
import React from "react";
import { withRouter } from "react-router-dom";
import { compose } from "recompose";

import { ExternalSyncReadinessState } from "../../../api/campaign";
import type { MutationMap, QueryMap } from "../../../network/types";
import { loadData } from "../../hoc/with-operations";
import SyncConfigurationModal from "./SyncConfigurationModal";

interface JobRequestResult {
  message: string;
  error_counts?: {
    [key: string]: number;
  };
}

const messageFromJobRquest = (job: JobRequest) => {
  try {
    const result: JobRequestResult = JSON.parse(job.resultMessage);
    return result.message;
  } catch {
    return `Error: could not parse result for job_request ${job.id}`;
  }
};

const errorListFromJobRequest = (job: JobRequest) => {
  let result: JobRequestResult;
  try {
    result = JSON.parse(job.resultMessage);
  } catch {
    return [`Error: could not parse result for job_request ${job.id}`];
  }

  if (result.error_counts) {
    return Object.entries(result.error_counts).map(
      ([error, error_count]) => `${error_count} - ${error}`
    );
  }

  return [];
};

interface HocProps {
  data: {
    campaign: Pick<Campaign, "id" | "syncReadiness">;
  };
  syncJobs: {
    campaign: Pick<Campaign, "id" | "pendingJobs">;
  };
  history: History;
  mutations: {
    syncCampaign(): ApolloQueryResult<boolean>;
    cancelSync(jobId: string): ApolloQueryResult<{ id: string }>;
  };
}

interface OuterProps {
  open: boolean;
  organizationId: string;
  campaignId: string;
  onRequestClose(): void;
  onComplete(): void;
}

interface InnerProps extends OuterProps, HocProps {}

interface State {
  isMappingOpen: boolean;
  isWorking: boolean;
}

class VanSyncModal extends React.Component<InnerProps, State> {
  state: State = {
    isMappingOpen: false,
    isWorking: false
  };

  handleOnClickSetIntegration = async () => {
    const { history, organizationId, campaignId } = this.props;
    this.props.onComplete();
    history.push(`/admin/${organizationId}/campaigns/${campaignId}/edit`);
  };

  handleOnClickConfigureMapping = async () =>
    this.setState({ isMappingOpen: true });

  handleOnDismissConfigureMapping = async () =>
    this.setState({ isMappingOpen: false });

  handleOnConfirmSync = async () => {
    this.setState({ isWorking: true });
    try {
      const response = await this.props.mutations.syncCampaign();
      if (response.errors) throw response.errors;
      this.props.onComplete();
    } catch (err) {
      console.error("error syncing campaign", err);
    } finally {
      this.setState({ isWorking: false });
    }
  };

  handleOnCancelSync = (jobId: string) => async () => {
    this.setState({ isWorking: true });
    try {
      const response = await this.props.mutations.cancelSync(jobId);
      if (response.errors) throw response.errors;
    } catch (err) {
      console.error("error cancelling campaign sync", err);
    } finally {
      this.setState({ isWorking: false });
    }
  };

  render() {
    const { isMappingOpen, isWorking } = this.state;
    const { open, organizationId, campaignId, data } = this.props;
    const {
      campaign: { syncReadiness }
    } = data;

    const latestSyncAttempt = this.props.syncJobs.campaign.pendingJobs[0];
    const isSyncing: boolean =
      latestSyncAttempt && latestSyncAttempt.status !== 100;
    const syncErrors = latestSyncAttempt
      ? errorListFromJobRequest(latestSyncAttempt)
      : [];

    const isSyncDisabled =
      window.EXPERIMENTAL_VAN_SYNC ||
      isWorking ||
      syncReadiness !== ExternalSyncReadinessState.READY ||
      isSyncing;

    const actions = [
      <Button key="cancel" onClick={this.props.onRequestClose}>
        Cancel
      </Button>,
      <Button
        key="sync"
        color="primary"
        disabled={isSyncDisabled}
        onClick={this.handleOnConfirmSync}
      >
        Sync
      </Button>
    ];

    return (
      <Dialog open={open} onClose={this.props.onRequestClose}>
        <DialogTitle>Sync to VAN</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will sync question responses and tags to VAN. For more
            information see{" "}
            <a
              href="https://docs.spokerewired.com/article/93-van-list-loading"
              target="_blank"
              rel="noopener noreferrer"
            >
              VAN Integration
            </a>
            .
          </DialogContentText>
          {isSyncing ? (
            <div>
              <p>Syncing campaign: {latestSyncAttempt.status}%</p>
              {syncErrors.length > 0 && [
                <p key="p">Encountered the following errors</p>,
                <ul key="ul">
                  {syncErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              ]}
              <Button
                variant="contained"
                color="primary"
                onClick={this.handleOnCancelSync(latestSyncAttempt.id)}
              >
                Cancel Sync
              </Button>
              <br />
              <br />
            </div>
          ) : (
            <p>
              Status:{" "}
              {syncReadiness === ExternalSyncReadinessState.READY && (
                <span style={{ color: green[300] }}>
                  Your campaign is ready to sync!
                </span>
              )}
              {syncReadiness ===
                ExternalSyncReadinessState.MISSING_REQUIRED_MAPPING && (
                <span style={{ color: red[500] }}>
                  Your campaign is missing a required sync mapping!
                </span>
              )}
              {syncReadiness ===
                ExternalSyncReadinessState.INCLUDES_NOT_ACTIVE_TARGETS && (
                <span style={{ color: red[500] }}>
                  Your campaign includes mappings to inactive or archived VAN
                  options!
                </span>
              )}
              {syncReadiness === ExternalSyncReadinessState.MISSING_SYSTEM && (
                <span style={{ color: red[500] }}>
                  No integration has been set for this campaign!
                </span>
              )}
            </p>
          )}
          {syncReadiness === ExternalSyncReadinessState.MISSING_SYSTEM && [
            <p key="1">Edit the Integration section of the campaign.</p>,
            <Button
              key="2"
              variant="contained"
              color="primary"
              disabled={isSyncing}
              onClick={this.handleOnClickSetIntegration}
            >
              Edit Campaign
            </Button>
          ]}
          {syncReadiness !== ExternalSyncReadinessState.MISSING_SYSTEM && (
            <Button
              variant="contained"
              color="primary"
              disabled={isSyncing}
              onClick={this.handleOnClickConfigureMapping}
            >
              Configure Mapping
            </Button>
          )}
          {isMappingOpen && (
            <SyncConfigurationModal
              organizationId={organizationId}
              campaignId={campaignId}
              onRequestClose={this.handleOnDismissConfigureMapping}
            />
          )}
          {latestSyncAttempt && latestSyncAttempt.status === 100 && (
            <DialogContentText>
              Last sync:
              <br />
              {new Date(latestSyncAttempt.updatedAt).toLocaleString()} -{" "}
              {messageFromJobRquest(latestSyncAttempt)}
            </DialogContentText>
          )}
          {window.EXPERIMENTAL_VAN_SYNC && (
            <p>
              This organization has experimental real time van sync enabled. You
              don't need to manually sync to van. Sync button is hence disabled.
            </p>
          )}
        </DialogContent>
        <DialogActions>{actions}</DialogActions>
      </Dialog>
    );
  }
}

const GET_CAMPAIGN_SYNC_JOBS = gql`
  query getCampaignSyncJobs($campaignId: String!, $jobTypes: [String]) {
    campaign(id: $campaignId) {
      id
      pendingJobs(jobTypes: $jobTypes) {
        id
        jobType
        status
        resultMessage
        createdAt
        updatedAt
      }
    }
  }
`;

const queries: QueryMap<InnerProps> = {
  data: {
    query: gql`
      query getCampaignSyncReadiness($campaignId: String!) {
        campaign(id: $campaignId) {
          id
          syncReadiness
        }
      }
    `,
    options: (ownProps) => ({
      variables: {
        campaignId: ownProps.campaignId
      }
    })
  },
  syncJobs: {
    query: GET_CAMPAIGN_SYNC_JOBS,
    options: (ownProps) => ({
      variables: {
        campaignId: ownProps.campaignId,
        jobTypes: ["sync_van_campaign"]
      },
      pollInterval: 10 * 1000
    })
  }
};

const mutations: MutationMap<InnerProps> = {
  syncCampaign: (ownProps) => () => ({
    mutation: gql`
      mutation syncCampaignToSystem($input: SyncCampaignToSystemInput!) {
        syncCampaignToSystem(input: $input)
      }
    `,
    variables: {
      input: {
        campaignId: ownProps.campaignId
      }
    }
  }),
  cancelSync: (ownProps) => (jobId: string) => ({
    mutation: gql`
      mutation cancelCampaignVanSync($campaignId: String!, $jobId: String!) {
        deleteJob(campaignId: $campaignId, id: $jobId) {
          id
        }
      }
    `,
    variables: {
      campaignId: ownProps.campaignId,
      jobId
    },
    refetchQueries: [
      {
        query: GET_CAMPAIGN_SYNC_JOBS,
        variables: {
          campaignId: ownProps.campaignId,
          jobTypes: ["sync_van_campaign"]
        }
      }
    ]
  })
};

export default compose<InnerProps, OuterProps>(
  withRouter,
  loadData({ queries, mutations })
)(VanSyncModal);
