import { ApolloQueryResult, gql } from "@apollo/client";
import Button from "@material-ui/core/Button";
import { TextField } from "material-ui";
import Toggle from "material-ui/Toggle";
import React from "react";
import { compose } from "recompose";

import { loadData } from "../../hoc/with-operations";
import CampaignFormSectionHeading from "../components/CampaignFormSectionHeading";
import {
  asSection,
  FullComponentProps,
  RequiredComponentProps
} from "../components/SectionWrapper";

interface AutoassignValues {
  isAutoassignEnabled: boolean;
  repliesStaleAfter: number | null;
}

const DEFAULT_RELEASE_STALE_REPLIES_AFTER = 30;

interface AutoassignHocProps {
  data: {
    campaign: AutoassignValues & {
      id: string;
    };
  };
  mutations: {
    editCampaign(payload: AutoassignValues): ApolloQueryResult<any>;
  };
}

interface AutoassignInnerProps extends FullComponentProps, AutoassignHocProps {}

interface AutoassignState {
  isAutoassignEnabled?: boolean;
  repliesStaleAfter?: number | null;
  isWorking: boolean;
}

class CampaignAutoassignModeForm extends React.Component<
  AutoassignInnerProps,
  AutoassignState
> {
  state: AutoassignState = {
    isAutoassignEnabled: undefined,

    // Undefined means there are no client side changes (use props.campaign.repliesStaleAfter)
    // Null means a database value of null
    repliesStaleAfter: undefined,
    isWorking: false
  };

  handleDidToggle = (
    _event: React.MouseEvent<unknown>,
    isAutoassignEnabled: boolean
  ) => this.setState({ isAutoassignEnabled });

  handleAutoReleaseToggle = (
    _event: React.MouseEvent<unknown>,
    isAutoReleaseEnabled: boolean
  ) =>
    this.setState({
      repliesStaleAfter: isAutoReleaseEnabled
        ? DEFAULT_RELEASE_STALE_REPLIES_AFTER
        : null
    });

  handleReleaseStaleRepliesAfterChange = (
    _event: React.FormEvent<unknown>,
    newVal: string
  ) =>
    this.setState({
      repliesStaleAfter: parseInt(newVal, 10)
    });

  handleDidSubmit = async () => {
    const { isAutoassignEnabled, repliesStaleAfter } = this.state;
    const { editCampaign } = this.props.mutations;

    this.setState({ isWorking: true });
    try {
      const response = await editCampaign({
        isAutoassignEnabled: isAutoassignEnabled!,
        repliesStaleAfter: repliesStaleAfter!
      });
      if (response.errors) throw response.errors;
      this.setState({
        isAutoassignEnabled: undefined,
        repliesStaleAfter: undefined
      });
    } catch (err) {
      this.props.onError(err.message);
    } finally {
      this.setState({ isWorking: false });
    }
  };

  render() {
    const { isWorking } = this.state;
    const {
      data: { campaign },
      saveLabel
    } = this.props;

    const isAutoassignEnabled =
      this.state.isAutoassignEnabled !== undefined
        ? this.state.isAutoassignEnabled!
        : campaign.isAutoassignEnabled;

    const repliesStaleAfter =
      this.state.repliesStaleAfter === undefined
        ? campaign.repliesStaleAfter
        : this.state.repliesStaleAfter;
    const isAutoReleaseEnabled = repliesStaleAfter !== null;

    const hasPendingChanges =
      (this.state.isAutoassignEnabled !== campaign.isAutoassignEnabled &&
        this.state.isAutoassignEnabled !== undefined) ||
      (this.state.repliesStaleAfter !== campaign.repliesStaleAfter &&
        this.state.repliesStaleAfter !== undefined);

    const isSaveDisabled = isWorking || !hasPendingChanges;
    const finalSaveLabel = isWorking ? "Working..." : saveLabel;

    return (
      <div>
        <CampaignFormSectionHeading
          title="Autoassign mode for campaign"
          subtitle="Please configure whether this campaign is eligible for autoassignment."
        />

        <Toggle
          label="Is autoassign enabled for this campaign?"
          toggled={isAutoassignEnabled}
          onToggle={this.handleDidToggle}
        />

        <Toggle
          label="Should we automatically release unhandled replies after a certain period of time?"
          toggled={isAutoReleaseEnabled}
          onToggle={this.handleAutoReleaseToggle}
        />

        {isAutoReleaseEnabled && (
          <div>
            <TextField
              name="idle_minutes"
              floatingLabelText="Idle Minutes"
              type="number"
              value={repliesStaleAfter!}
              onChange={this.handleReleaseStaleRepliesAfterChange}
            />
          </div>
        )}

        <Button
          variant="contained"
          disabled={isSaveDisabled}
          onClick={this.handleDidSubmit}
        >
          {finalSaveLabel}
        </Button>
      </div>
    );
  }
}

const queries = {
  data: {
    query: gql`
      query getCampaignAutoassign($campaignId: String!) {
        campaign(id: $campaignId) {
          id
          isAutoassignEnabled
          repliesStaleAfter
        }
      }
    `,
    options: (ownProps: AutoassignInnerProps) => ({
      variables: {
        campaignId: ownProps.campaignId
      }
    })
  }
};

const mutations = {
  editCampaign: (ownProps: AutoassignInnerProps) => (
    payload: AutoassignValues
  ) => ({
    mutation: gql`
      mutation editCampaignAutoassign(
        $campaignId: String!
        $payload: CampaignInput!
      ) {
        editCampaign(id: $campaignId, campaign: $payload) {
          id
          isAutoassignEnabled
          repliesStaleAfter
          readiness {
            id
            autoassign
          }
        }
      }
    `,
    variables: {
      campaignId: ownProps.campaignId,
      payload
    }
  })
};

export default compose<AutoassignInnerProps, RequiredComponentProps>(
  asSection({
    title: "Autoassign Mode",
    readinessName: "autoassign",
    jobQueueNames: [],
    expandAfterCampaignStarts: true,
    expandableBySuperVolunteers: false
  }),
  loadData({
    queries,
    mutations
  })
)(CampaignAutoassignModeForm);
