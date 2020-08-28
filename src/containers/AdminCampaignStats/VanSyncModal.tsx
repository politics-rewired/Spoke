import React from "react";
import gql from "graphql-tag";

import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
import { red500, green300 } from "material-ui/styles/colors";

import { loadData } from "../hoc/with-operations";
import { ExternalSyncReadinessState } from "../../api/campaign";

interface HocProps {
  data: {
    campaign: {
      id: string;
      syncReadiness: ExternalSyncReadinessState;
    };
  };
  mutations: {};
}

interface OuterProps {
  open: boolean;
  campaignId: string;
  onRequestClose(): void;
  onComplete(): void;
}

interface InnerProps extends OuterProps, HocProps {}

interface State {
  // TODO: stub
}

class VanSyncModal extends React.Component<InnerProps, State> {
  state: State = {};

  handleOnConfirm = async () => {
    const {} = this.state;
    console.log("kick off sync mutation");
    this.props.onComplete();
  };

  handleOnChangeVanIdField = (
    event: React.SyntheticEvent<{}>,
    index: number,
    vanIdField: string
  ) => this.setState({ vanIdField });

  handleOnToggleIncludeUnmessages = (
    event: React.MouseEvent<{}>,
    includeUnmessaged: boolean
  ) => this.setState({ includeUnmessaged });

  render() {
    const {} = this.state;
    const { open, data } = this.props;
    const {
      campaign: { syncReadiness }
    } = data;

    const actions = [
      <FlatButton label="Cancel" onClick={this.props.onRequestClose} />,
      <FlatButton
        label="Sync"
        primary={true}
        disabled={syncReadiness !== ExternalSyncReadinessState.READY}
        onClick={this.handleOnConfirm}
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
          {syncReadiness === ExternalSyncReadinessState.MISSING_SYSTEM && (
            <span style={{ color: red500 }}>
              No integration has been set for this campaign!
            </span>
          )}
        </p>
        <br />
      </Dialog>
    );
  }
}

const queries = {
  data: {
    query: gql`
      query getCampaignCustomFields($campaignId: String!) {
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

const mutations = {};

export default loadData({ queries, mutations })(VanSyncModal);
