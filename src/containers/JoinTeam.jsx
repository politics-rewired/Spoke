import PropTypes from "prop-types";
import React from "react";
import gql from "graphql-tag";
import { withRouter } from "react-router";
import { compose } from "react-apollo";
import { StyleSheet, css } from "aphrodite";

import { loadData } from "./hoc/with-operations";
import theme from "../styles/theme";

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
    try {
      organization = await this.props.mutations.joinOrganization();
      if (organization.errors) throw organization.errors;
    } catch (ex) {
      this.setState({
        errors: `Something went wrong trying to join this organization. Please contact your administrator.\n\n${ex.message}`
      });
      return;
    }

    if (this.props.match.params.campaignId) {
      try {
        campaign = await this.props.mutations.assignUserToCampaign();
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
            <p>{part}</p>
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
  joinOrganization: (ownProps) => () => ({
    mutation: gql`
      mutation joinOrganization($organizationUuid: String!) {
        joinOrganization(organizationUuid: $organizationUuid) {
          id
        }
      }
    `,
    variables: { organizationUuid: ownProps.match.params.organizationUuid }
  }),
  assignUserToCampaign: (ownProps) => () => ({
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
      organizationUuid: ownProps.match.params.organizationUuid
    }
  })
};

export default compose(withRouter, loadData({ mutations }))(JoinTeam);
