import type { ApolloQueryResult } from "@apollo/client";
import { gql } from "@apollo/client";
import type { Organization } from "@spoke/spoke-codegen";
import { css, StyleSheet } from "aphrodite/no-important";
import muiThemeable from "material-ui/styles/muiThemeable";
import React from "react";
import type { RouteChildrenProps } from "react-router-dom";
import { withRouter } from "react-router-dom";
import { compose } from "recompose";

import type { MutationMap } from "../network/types";
import theme from "../styles/theme";
import type { MuiThemeProviderProps } from "../styles/types";
import { loadData } from "./hoc/with-operations";

const styles = StyleSheet.create({
  greenBox: {
    ...theme.layouts.greenBox
  }
});

interface InnerProps
  extends RouteChildrenProps<{ campaignId: string; organizationUuid: string }>,
    MuiThemeProviderProps {
  mutations: {
    joinOrganization: () => Promise<
      ApolloQueryResult<{ joinOrganization: Pick<Organization, "id"> }>
    >;
    assignUserToCampaign: () => Promise<ApolloQueryResult<never>>;
  };
}

interface State {
  errors: string | null;
}

class JoinTeam extends React.Component<InnerProps, State> {
  state: State = {
    errors: null
  };

  async UNSAFE_componentWillMount() {
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

    if (this.props.match?.params.campaignId) {
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
    const { muiTheme } = this.props;

    const style: React.CSSProperties = {
      backgroundColor: muiTheme?.palette?.primary1Color ?? theme.colors.green
    };

    if (this.state.errors) {
      return (
        <div className={css(styles.greenBox)} style={style}>
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

const mutations: MutationMap<InnerProps> = {
  joinOrganization: (ownProps) => () => ({
    mutation: gql`
      mutation joinOrganization($organizationUuid: String!) {
        joinOrganization(organizationUuid: $organizationUuid) {
          id
        }
      }
    `,
    variables: { organizationUuid: ownProps.match?.params.organizationUuid }
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
      campaignId: ownProps.match?.params.campaignId,
      organizationUuid: ownProps.match?.params.organizationUuid
    }
  })
};

export default compose(
  muiThemeable(),
  withRouter,
  loadData({ mutations })
)(JoinTeam);
