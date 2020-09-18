import React from "react";
import { History } from "history";
import { withRouter } from "react-router";
import { compose } from "recompose";
import gql from "graphql-tag";
import { ApolloQueryResult } from "apollo-client";

import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
import RaisedButton from "material-ui/RaisedButton";
import { red500, green300 } from "material-ui/styles/colors";

import { ExternalSyncReadinessState } from "../../api/campaign";
import { loadData } from "../hoc/with-operations";
import { MutationMap } from "../../network/types";
import SyncConfigurationModal from "../../components/SyncConfigurationModal";

interface HocProps {
  data: {
    campaign: {
      id: string;
      syncReadiness: ExternalSyncReadinessState;
    };
  };
  history: History;
  mutations: {
    syncCampaign(): ApolloQueryResult<boolean>;
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

  render() {
    const { isMappingOpen, isWorking } = this.state;
    const { open, organizationId, campaignId, data } = this.props;
    const {
      campaign: { syncReadiness }
    } = data;

    const isSyncDisabled =
      isWorking || syncReadiness !== ExternalSyncReadinessState.READY;

    const actions = [
      <FlatButton label="Cancel" onClick={this.props.onRequestClose} />,
      <FlatButton
        label="Sync"
        primary={true}
        disabled={isSyncDisabled}
        onClick={this.handleOnConfirmSync}
      />
    ];

    return (
      <Dialog
        open={open}
        title="Sync to VAN"
        actions={actions}
        onRequestClose={this.props.onRequestClose}
      >
        <p>
          This will sync question responses and tags to VAN. For more
          information see{" "}
          <a href="https://docs.spokerewired.com/" target="_blank">
            TODO
          </a>.
        </p>
        <p>
          Status:{" "}
          {syncReadiness === ExternalSyncReadinessState.READY && (
            <span style={{ color: green300 }}>
              Your campaign is ready to sync!
            </span>
          )}
          {syncReadiness ===
            ExternalSyncReadinessState.MISSING_REQUIRED_MAPPING && (
            <span style={{ color: red500 }}>
              Your campaign is missing a required sync mapping!
            </span>
          )}
          {syncReadiness ===
            ExternalSyncReadinessState.INCLUDES_NOT_ACTIVE_TARGETS && (
            <span style={{ color: red500 }}>
              Your campaign includes mappings to inactive or archived VAN
              options!
            </span>
          )}
          {syncReadiness === ExternalSyncReadinessState.MISSING_SYSTEM && (
            <span style={{ color: red500 }}>
              No integration has been set for this campaign!
            </span>
          )}
        </p>
        {syncReadiness === ExternalSyncReadinessState.MISSING_SYSTEM && [
          <p key="1">Edit the Integration section of the campaign.</p>,
          <RaisedButton
            key="2"
            label="Edit Campaign"
            primary={true}
            onClick={this.handleOnClickSetIntegration}
          />
        ]}
        {syncReadiness !== ExternalSyncReadinessState.MISSING_SYSTEM && (
          <RaisedButton
            label="Configure Mapping"
            primary={true}
            onClick={this.handleOnClickConfigureMapping}
          />
        )}
        {isMappingOpen && (
          <SyncConfigurationModal
            organizationId={organizationId}
            campaignId={campaignId}
            onRequestClose={this.handleOnDismissConfigureMapping}
          />
        )}
      </Dialog>
    );
  }
}

const queries = {
  data: {
    query: gql`
      query getCampaignSyncReadiness($campaignId: String!) {
        campaign(id: $campaignId) {
          id
          syncReadiness
        }
      }
    `,
    options: (ownProps: OuterProps) => ({
      variables: {
        campaignId: ownProps.campaignId
      }
    })
  }
};

const mutations: MutationMap<InnerProps> = {
  syncCampaign: ownProps => () => ({
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
  })
};

export default compose<InnerProps, OuterProps>(
  withRouter,
  loadData({ queries, mutations })
)(VanSyncModal);
