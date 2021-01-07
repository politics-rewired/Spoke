import { css, StyleSheet } from "aphrodite";
import gql from "graphql-tag";
import PropTypes from "prop-types";
import React from "react";
import { compose } from "react-apollo";
import { withRouter } from "react-router-dom";

import theme from "../styles/theme";
import { loadData } from "./hoc/with-operations";

const styles = StyleSheet.create({
  greenBox: {
    ...theme.layouts.greenBox
  }
});

class JoinTeam extends React.Component {
  state = {
    errors: null
  };

  async componentWillMount() {
    let organization = null;
    let campaign = null;
    // determine if the invite link is for a superadmin by splitting orgUUID by '&',
    // and checking for presence of 'superadmin' after UUID
    const orgIdComponents = this.props.match.params.organizationUuid.split("&");
    const organizationUuid = orgIdComponents[0];
    const makeSuperadmin =
      orgIdComponents.length === 2 && orgIdComponents[1] === "superadmin";
    try {
      organization = await this.props.mutations.joinOrganization(
        organizationUuid,
        makeSuperadmin
      );
      if (organization.errors) throw organization.errors;
    } catch (ex) {
      this.setState({
        errors: `Something went wrong trying to join this organization. Please contact your administrator.\n\n${ex.message}`
      });
      return;
    }

    if (this.props.match.params.campaignId) {
      try {
        campaign = await this.props.mutations.assignUserToCampaign(
          organizationUuid
        );
        if (campaign.errors) throw campaign.errors;
      } catch (ex) {
        this.setState({
          errors: `Something went wrong trying to join this campaign. Please contact your administrator.\n\n${ex.message}`
        });
        return;
      }
    }

    if (organization) {
      this.props.history.push(`/app/${organization.data.joinOrganization.id}`);
    }
  }

  renderErrors() {
    if (this.state.errors) {
      return (
        <div className={css(styles.greenBox)}>
          {this.state.errors.split("\n").map((part) => (
            <p key={part}>{part}</p>
          ))}
        </div>
      );
    }
    return <div />;
  }

  render() {
    return <div>{this.renderErrors()}</div>;
  }
}

JoinTeam.propTypes = {
  mutations: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  match: PropTypes.object.isRequired
};

const mutations = {
  joinOrganization: (_ownProps) => (organizationUuid, makeSuperadmin) => ({
    mutation: gql`
      mutation joinOrganization(
        $organizationUuid: String!
        $makeSuperadmin: Boolean!
      ) {
        joinOrganization(
          organizationUuid: $organizationUuid
          makeSuperadmin: $makeSuperadmin
        ) {
          id
        }
      }
    `,
    variables: { organizationUuid, makeSuperadmin }
  }),
  assignUserToCampaign: (ownProps) => (organizationUuid) => ({
    mutation: gql`
      mutation assignUserToCampaign(
        $organizationUuid: String!
        $campaignId: String!
      ) {
        assignUserToCampaign(
          organizationUuid: $organizationUuid
          campaignId: $campaignId
        ) {
          id
        }
      }
    `,
    variables: {
      campaignId: ownProps.match.params.campaignId,
      organizationUuid
    }
  })
};

export default compose(withRouter, loadData({ mutations }))(JoinTeam);
