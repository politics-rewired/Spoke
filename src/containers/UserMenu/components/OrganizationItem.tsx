import { ApolloClient } from "@apollo/client";
import gql from "graphql-tag";
import MenuItem from "material-ui/MenuItem";
import React from "react";
import { RouterProps } from "react-router-dom";

import { Organization } from "../../../api/organization";
import { UserRoleType } from "../../../api/organization-membership";
import { User } from "../../../api/user";
import { hasRole } from "../../../lib/permissions";

// Accept history as passed prop because we cannot use withRouter within UserMenu's Popover
// (Popover content exists outside of <BrowserRouter> context)
interface Props extends Pick<RouterProps, "history"> {
  organization: Pick<Organization, "id" | "name">;
  client: ApolloClient<any>;
}

interface State {
  loading: boolean;
  roles?: UserRoleType[];
}

class OrganizationItemInner extends React.Component<Props, State> {
  state: State = {
    loading: true,
    roles: undefined
  };

  componentDidMount() {
    // Perform this query manually because we cannot use withOperations within
    // UserMenu's Popover (Popover exists outside of <ApolloProvider> context)
    this.props.client
      .query<{
        currentUser: Pick<User, "id" | "roles">;
      }>({
        query: gql`
          query getCurrentUserRoles($organizationId: String!) {
            currentUser {
              id
              roles(organizationId: $organizationId)
            }
          }
        `,
        variables: {
          organizationId: this.props.organization.id
        }
      })
      .then((res) => {
        const { roles } = res.data.currentUser;
        const newState: State = { loading: false, roles };
        this.setState(newState);
      });
  }

  render() {
    const { organization, history } = this.props;
    const { loading, roles } = this.state;
    const path =
      !loading &&
      roles !== undefined &&
      hasRole(UserRoleType.SUPERVOLUNTEER, roles)
        ? `/admin/${organization.id}`
        : `/app/${organization.id}`;

    // Use `any` because of mismatch between @types/react versions
    const handleClick = (event: any) => {
      event.preventDefault();
      history.push(path);
    };

    return (
      <MenuItem
        primaryText={organization.name}
        value={path}
        disabled={loading}
        onClick={handleClick}
      />
    );
  }
}

export default OrganizationItemInner;
