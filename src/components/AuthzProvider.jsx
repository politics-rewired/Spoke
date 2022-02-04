import { gql } from "@apollo/client";
import createReactContext from "create-react-context";
import PropTypes from "prop-types";
import React from "react";

import { hasRole } from "../lib/permissions";
import ApolloClientSingleton from "../network/apollo-client-singleton";
import OrgSettingsFetcher from "./OrgSettingsFetcher";

const AuthzContext = createReactContext(false);

export class AuthzProvider extends React.Component {
  state = { adminPerms: undefined };

  componentDidMount() {
    this.refreshAdminPerms();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.organizationId !== this.props.organizationId) {
      this.refreshAdminPerms();
    }
  }

  refreshAdminPerms = () => {
    const { organizationId } = this.props;
    const loginUrl = `/login?nextUrl=${window.location.pathname}`;

    ApolloClientSingleton.query({
      query: gql`
        query currentUser($organizationId: String!) {
          currentUser {
            id
            roles(organizationId: $organizationId)
          }
        }
      `,
      variables: { organizationId }
    })
      .then((result) => hasRole("ADMIN", result.data.currentUser.roles))
      .then((adminPerms) => this.setState({ adminPerms }))
      // We can't use replace(...) here because /login is not a react-router path
      .catch((_err) => {
        window.location = loginUrl;
      });
  };

  render() {
    const { adminPerms } = this.state;
    // Wait to render anything until we have fetched user roles
    if (adminPerms === undefined) {
      return <div />;
    }

    return (
      <AuthzContext.Provider value={adminPerms}>
        <OrgSettingsFetcher organizationId={this.props.organizationId}>
          {this.props.children}
        </OrgSettingsFetcher>
      </AuthzContext.Provider>
    );
  }
}

AuthzProvider.propTypes = {
  organizationId: PropTypes.string.isRequired
};

export const withAuthzContext = (Component) =>
  function WithAuthzContext(props) {
    return (
      <AuthzContext.Consumer>
        {(adminPerms) => <Component {...props} adminPerms={adminPerms} />}
      </AuthzContext.Consumer>
    );
  };
