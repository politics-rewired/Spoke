import gql from "graphql-tag";
import PropTypes from "prop-types";
import React from "react";

import { loadData } from "../hoc/with-operations";
import AssignmentHUD from "./AssignmentHUD";
import CampaignListLoader from "./CampaignListLoader";
import { OperationDialog, operations } from "./OperationDialog";

export class CampaignList extends React.Component {
  state = {
    inProgress: undefined,
    error: undefined,
    executing: false,
    finished: undefined
  };

  start = (operation, campaign, variables) => () =>
    this.setState({ inProgress: [operation, campaign, variables] });

  clearInProgress = () =>
    this.setState({
      inProgress: undefined,
      error: undefined,
      executing: false,
      finished: undefined
    });

  boundSetState = (state, callback) => this.setState(state, callback);

  executeOperation = () => {
    this.setState({ executing: true });
    const [operationName, campaign, variables] = this.state.inProgress;

    this.props.mutations[operationName](campaign.id, variables)
      .then((resp) => {
        const dataKey = Object.keys(resp.data)[0];
        this.setState({ finished: resp.data[dataKey], executing: false });
      })
      .catch((error) => {
        this.setState({ error, executing: false });
      });
  };

  render() {
    const { inProgress, error, finished, executing } = this.state;
    const {
      organizationId,
      pageSize,
      currentPageIndex,
      campaignsFilter,
      adminPerms,
      data,
      mutations,
      resultCountDidUpdate
    } = this.props;
    const { currentAssignmentTargets } = data.organization;
    const { archiveCampaign, unarchiveCampaign } = mutations;
    return (
      <div>
        {inProgress && (
          <OperationDialog
            operations={operations}
            inProgress={inProgress}
            error={error}
            finished={finished}
            executing={executing}
            setState={this.boundSetState}
            clearInProgress={this.clearInProgress}
            executeOperation={this.executeOperation}
          />
        )}
        <AssignmentHUD assignmentTargets={currentAssignmentTargets} />
        <CampaignListLoader
          organizationId={organizationId}
          campaignsFilter={campaignsFilter}
          offset={currentPageIndex * pageSize}
          limit={pageSize}
          adminPerms={adminPerms}
          resultCountDidUpdate={resultCountDidUpdate}
          startOperation={this.start}
          archiveCampaign={archiveCampaign}
          unarchiveCampaign={unarchiveCampaign}
        />
      </div>
    );
  }
}

CampaignList.propTypes = {
  organizationId: PropTypes.string.isRequired,
  campaignsFilter: PropTypes.object.isRequired,
  pageSize: PropTypes.number.isRequired,
  currentPageIndex: PropTypes.number,
  adminPerms: PropTypes.bool.isRequired,
  data: PropTypes.object.isRequired,
  mutations: PropTypes.object.isRequired,
  resultCountDidUpdate: PropTypes.func.isRequired
};

CampaignList.defaultProps = {
  currentPageIndex: 0
};

const campaignInfoFragment = `
  id
  title
  isStarted
  isArchived
  hasUnassignedContacts
  hasUnsentInitialMessages
  hasUnhandledMessages
  description
  dueBy
  creator {
    displayName
  }
`;

const mutations = {
  archiveCampaign: (_ownProps) => (campaignId) => ({
    mutation: gql`mutation archiveCampaign($campaignId: String!) {
          archiveCampaign(id: $campaignId) {
            ${campaignInfoFragment}
          }
        }`,
    variables: { campaignId }
  }),
  unarchiveCampaign: (_ownProps) => (campaignId) => ({
    mutation: gql`mutation unarchiveCampaign($campaignId: String!) {
        unarchiveCampaign(id: $campaignId) {
          ${campaignInfoFragment}
        }
      }`,
    variables: { campaignId }
  }),
  releaseUnsentMessages: (_ownProps) => (campaignId) => ({
    mutation: gql`
      mutation releaseUnsentMessages(
        $campaignId: String!
        $target: ReleaseActionTarget!
      ) {
        releaseMessages(campaignId: $campaignId, target: $target)
      }
    `,
    variables: {
      target: "UNSENT",
      campaignId
    }
  }),
  markForSecondPass: (_ownProps) => (
    campaignId,
    { excludeRecentlyTexted, days, hours }
  ) => ({
    mutation: gql`
      mutation markForSecondPass(
        $campaignId: String!
        $excludeAgeInHours: Float
      ) {
        markForSecondPass(
          campaignId: $campaignId
          excludeAgeInHours: $excludeAgeInHours
        )
      }
    `,
    variables: {
      excludeAgeInHours: excludeRecentlyTexted ? days * 24 + hours : undefined,
      campaignId
    }
  }),
  releaseUnrepliedMessages: (_ownProps) => (campaignId, { ageInHours }) => ({
    mutation: gql`
      mutation releaseUnrepliedMessages(
        $campaignId: String!
        $target: ReleaseActionTarget!
        $ageInHours: Float!
      ) {
        releaseMessages(
          campaignId: $campaignId
          target: $target
          ageInHours: $ageInHours
        )
      }
    `,
    variables: {
      target: "UNREPLIED",
      campaignId,
      ageInHours
    }
  }),
  deleteNeedsMessage: (_ownProps) => (campaignId, _) => ({
    mutation: gql`
      mutation deleteNeedsMessage($campaignId: String!) {
        deleteNeedsMessage(campaignId: $campaignId)
      }
    `,
    variables: {
      campaignId
    }
  }),
  unMarkForSecondPass: (_ownProps) => (campaignId, _) => ({
    mutation: gql`
      mutation unMarkForSecondPass($campaignId: String!) {
        unMarkForSecondPass(campaignId: $campaignId)
      }
    `,
    variables: {
      campaignId
    }
  }),
  turnAutoAssignOn: (_ownProps) => (campaignId, _) => ({
    mutation: gql`
      mutation turnAutoAssignOn($campaignId: String!) {
        editCampaign(id: $campaignId, campaign: { isAutoassignEnabled: true }) {
          id
          isAutoassignEnabled
        }
      }
    `,
    variables: { campaignId }
  }),
  turnAutoAssignOff: (_ownProps) => (campaignId, _) => ({
    mutation: gql`
      mutation turnAutoAssignOff($campaignId: String!) {
        editCampaign(
          id: $campaignId
          campaign: { isAutoassignEnabled: false }
        ) {
          id
          isAutoassignEnabled
        }
      }
    `,

    variables: { campaignId }
  })
};

const queries = {
  data: {
    query: gql`
      query adminGetCampaigns($organizationId: String!) {
        organization(id: $organizationId) {
          id
          currentAssignmentTargets {
            type
            campaign {
              id
              title
            }
            teamTitle
            countLeft
            enabled
          }
        }
      }
    `,
    options: (ownProps) => ({
      variables: {
        organizationId: ownProps.organizationId
      },
      fetchPolicy: "network-only"
    })
  }
};

export default loadData({
  queries,
  mutations
})(CampaignList);
