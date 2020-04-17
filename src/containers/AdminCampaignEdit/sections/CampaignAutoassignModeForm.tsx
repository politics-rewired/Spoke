import React from "react";
import gql from "graphql-tag";
import { compose } from "recompose";
import { ApolloQueryResult } from "apollo-client";

import Toggle from "material-ui/Toggle";
import RaisedButton from "material-ui/RaisedButton";

import { loadData } from "../../hoc/with-operations";
import {
  asSection,
  RequiredComponentProps
} from "../components/SectionWrapper";
import CampaignFormSectionHeading from "../components/CampaignFormSectionHeading";

interface AutoassignValues {
  isAutoassignEnabled: boolean;
}

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

interface AutoassignInnerProps
  extends RequiredComponentProps,
    AutoassignHocProps {}

interface AutoassignState {
  isAutoassignEnabled?: boolean;
  isWorking: boolean;
}

class CampaignAutoassignModeForm extends React.Component<
  AutoassignInnerProps,
  AutoassignState
> {
  state = {
    isAutoassignEnabled: undefined,
    isWorking: false
  };

  handleDidToggle = (
    _event: React.MouseEvent<{}>,
    isAutoassignEnabled: boolean
  ) => this.setState({ isAutoassignEnabled });

  handleDidSubmit = async () => {
    const isAutoassignEnabled = this.state.isAutoassignEnabled!;
    const { editCampaign } = this.props.mutations;

    this.setState({ isWorking: true });
    try {
      const response = await editCampaign({ isAutoassignEnabled });
      if (response.errors) throw response.errors;
      this.setState({ isAutoassignEnabled: undefined });
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
    const hasPendingChanges =
      this.state.isAutoassignEnabled !== campaign.isAutoassignEnabled &&
      this.state.isAutoassignEnabled !== undefined;

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

        <RaisedButton
          label={finalSaveLabel}
          disabled={isSaveDisabled}
          onClick={this.handleDidSubmit}
        />
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
