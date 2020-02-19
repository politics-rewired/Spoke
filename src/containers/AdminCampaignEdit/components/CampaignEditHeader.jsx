import PropTypes from "prop-types";
import React from "react";
import { compose } from "react-apollo";
import gql from "graphql-tag";
import moment from "moment";

import RaisedButton from "material-ui/RaisedButton";
import { red600 } from "material-ui/styles/colors";

import { loadData } from "../../hoc/with-operations";
import { dataTest } from "../../../lib/attributes";
import { withAuthzContext } from "../../../components/AuthzProvider";
import theme from "../../../styles/theme";

const StartButton = props => {
  const {
    adminPerms,
    mutations,
    campaignId,
    isArchived,
    onChangeStarting
  } = props;

  // TODO: this should be based on a new type on the campaign that performs minimal queries
  // necessary for each section and is refreshed by saves and job polls
  const isCampaignComplete = true;

  // Supervolunteers don't have access to start the campaign or un/archive it
  if (!adminPerms) return null;

  const containerStyle = { ...theme.layouts.multiColumn.container };
  const columnStyle = { ...theme.layouts.multiColumn.flexColumn };

  const statusText = isCampaignComplete
    ? "Your campaign is all good to go! >>>>>>>>>"
    : "You need to complete all the sections below before you can start this campaign";

  const handleArchive = () => mutations.unarchiveCampaign(campaignId);
  const handleUnarchive = () => mutations.unarchiveCampaign(campaignId);

  return (
    <div style={containerStyle}>
      <div style={columnStyle}>{statusText}</div>
      <div>
        <RaisedButton
          label={isArchived ? "Unarchive" : "Archive"}
          onClick={isArchived ? handleUnarchive : handleArchive}
        />
        <RaisedButton
          {...dataTest("startCampaign")}
          primary
          label="Start This Campaign!"
          disabled={!isCampaignComplete}
          onClick={async () => {
            onChangeStarting(true);
            await mutations.startCampaign(campaignId);
            onChangeStarting(false);
          }}
        />
      </div>
    </div>
  );
};

StartButton.propTypes = {
  adminPerms: PropTypes.bool.isRequired,
  mutations: PropTypes.object.isRequired,
  campaignId: PropTypes.string.isRequired,
  isArchived: PropTypes.bool.isRequired,
  onChangeStarting: PropTypes.func.isRequired
};

const inlineStyles = {
  headerContainer: {
    marginBottom: 15,
    fontSize: 16
  },
  startingCampaignText: {
    color: theme.colors.gray,
    fontWeight: 800
  },
  startingCampaignProgress: {
    verticalAlign: "middle",
    display: "inline-block"
  }
};

class CampaignEditHeader extends React.Component {
  state = {
    startingCampaign: false
  };

  handleChangeStarting = startingCampaign =>
    this.setState({ startingCampaign });

  render() {
    const { startingCampaign } = this.state;
    const { campaign, ...passthroughProps } = this.props;
    const {
      id: campaignId,
      title,
      editors,
      dueBy,
      isArchived,
      isStarted
    } = campaign.campaign;
    const isOverdue = moment().isSameOrAfter(dueBy);

    const statusColor = isOverdue ? red600 : theme.colors.green;
    const statusText = isOverdue
      ? "This campaign is running but is overdue!"
      : "This campaign is running!";

    return (
      <div style={inlineStyles.headerContainer}>
        <h1>{title}</h1>
        {startingCampaign ? (
          <div style={inlineStyles.startingCampaignText}>
            <CircularProgress
              size={0.5}
              style={inlineStyles.startingCampaignProgress}
            />
            Starting your campaign...
          </div>
        ) : isStarted ? (
          <div
            {...dataTest("campaignIsStarted")}
            style={{
              color: statusColor,
              fontWeight: 800
            }}
          >
            {statusText}
          </div>
        ) : (
          <StartButton
            campaignId={campaignId}
            isArchived={isArchived}
            onChangeStarting={this.handleChangeStarting}
            {...passthroughProps}
          />
        )}
        {editors && <div>This campaign is being edited by: {editors}</div>}
      </div>
    );
  }
}

CampaignEditHeader.defaultProps = {};

CampaignEditHeader.propTypes = {
  campaignId: PropTypes.string.isRequired,

  // AuthzProvider props
  adminPerms: PropTypes.bool.isRequired,

  // GraphQL props
  mutations: PropTypes.object.isRequired,
  campaign: PropTypes.shape({
    campaign: PropTypes.shape({
      isArchived: PropTypes.bool.isRequired,
      isStarted: PropTypes.bool.isRequired,
      title: PropTypes.string,
      editors: PropTypes.string,
      dueBy: PropTypes.string
    }).isRequired
  }).isRequired
};

const queries = {
  campaign: {
    query: gql`
      query getCampaign($campaignId: String!) {
        campaign(id: $campaignId) {
          id
          title
          isArchived
          isStarted
          editors
          dueBy
        }
      }
    `,
    options: ownProps => ({
      variables: {
        campaignId: ownProps.campaignId
      },
      pollInterval: 5000
    })
  }
};

const mutations = {
  archiveCampaign: ownprops => campaignId => ({
    mutation: gql`
      mutation archiveCampaign($campaignId: String!) {
        archiveCampaign(id: $campaignId) {
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
          isArchived
        }
      }
    `,
    variables: { campaignId }
  }),
  startCampaign: ownProps => campaignId => ({
    mutation: gql`
      mutation startCampaign($campaignId: String!) {
        startCampaign(id: $campaignId) {
          isStarted
        }
      }
    `,
    variables: { campaignId }
  })
};

export default compose(
  withAuthzContext,
  loadData({ queries, mutations })
)(CampaignEditHeader);
