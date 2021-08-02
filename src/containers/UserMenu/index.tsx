import OpenInNewIcon from "@material-ui/icons/OpenInNew";
import gql from "graphql-tag";
import Avatar from "material-ui/Avatar";
import Divider from "material-ui/Divider";
import IconButton from "material-ui/IconButton";
import Menu from "material-ui/Menu";
import MenuItem from "material-ui/MenuItem";
import Popover from "material-ui/Popover";
import Subheader from "material-ui/Subheader";
import React, { Component } from "react";
import { ApolloProviderProps, compose, withApollo } from "react-apollo";
import { RouterProps, withRouter } from "react-router-dom";

import { Organization } from "../../api/organization";
import { User } from "../../api/user";
import { dataTest } from "../../lib/attributes";
import { QueryMap } from "../../network/types";
import { withOperations } from "../hoc/with-operations";
import OrganizationItem from "./components/OrganizationItem";

const avatarSize = 28;

type CurrentUser = Pick<User, "id" | "displayName" | "email"> & {
  organizations: Pick<Organization, "id" | "name">[];
};

interface Props
  extends Pick<RouterProps, "history">,
    Pick<ApolloProviderProps<any>, "client"> {
  orgId: string;
  data: {
    currentUser: CurrentUser;
  };
}

interface State {
  open: boolean;
}

class UserMenu extends Component<Props, State> {
  anchorRef: Element | undefined = undefined;

  state: State = {
    open: false
  };

  // Use `any` because of mismatch between @types/react versions
  handleTouchTap = (event: any) => {
    // This prevents ghost click.
    event.preventDefault();

    this.setState({ open: true });
  };

  handleRequestClose = () => this.setState({ open: false });

  handleMenuChange = (_e: React.SyntheticEvent<unknown>, value: any) => {
    const { orgId, data, history } = this.props;
    const { currentUser } = data;

    this.handleRequestClose();

    // Handle only named routes (org navigation is done in OrganizationItem
    // becase MenuItem change is only handled if it's a direct descendent of Menu)
    if (value === "logout") {
      if (window.PASSPORT_STRATEGY === "auth0") {
        // Handle Auth0 logout in-browser
        return window.AuthService.logout();
      }
      // Let Passport handle the logout
      window.location.href = "/logout-callback";
    } else if (value === "account") {
      if (orgId) {
        history.push(`/app/${orgId}/account/${currentUser.id}`);
      }
    } else if (value === "home") {
      history.push(`/app/${orgId}/todos`);
    } else if (value === "docs") {
      window.open("https://docs.spokerewired.com", "_blank");
    }
  };

  renderAvatar = (user: CurrentUser, size: number) => {
    // Material-UI seems to not be handling this correctly when doing serverside rendering
    const inlineStyles = {
      lineHeight: "1.25",
      textAlign: "center",
      color: "white",
      padding: "5px"
    };
    return (
      <Avatar style={inlineStyles} size={size}>
        {user.displayName.charAt(0)}
      </Avatar>
    );
  };

  render() {
    const { orgId, data, history, client } = this.props;
    const { currentUser } = data;

    if (!currentUser) {
      return <div />;
    }

    const { open } = this.state;

    return (
      <div
        ref={(el) => {
          this.anchorRef = el ?? undefined;
        }}
      >
        <IconButton
          {...dataTest("userMenuButton")}
          onClick={this.handleTouchTap}
          iconStyle={{ fontSize: "18px" }}
        >
          {this.renderAvatar(currentUser, avatarSize)}
        </IconButton>
        <Popover
          open={open}
          anchorEl={this.anchorRef}
          anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
          targetOrigin={{ horizontal: "left", vertical: "top" }}
          onRequestClose={this.handleRequestClose}
        >
          <Menu onChange={this.handleMenuChange}>
            <MenuItem
              {...dataTest("userMenuDisplayName")}
              primaryText={currentUser.displayName}
              leftIcon={this.renderAvatar(currentUser, 40)}
              disabled={!orgId}
              value="account"
            >
              {currentUser.email}
            </MenuItem>
            <Divider />
            <MenuItem {...dataTest("home")} primaryText="Home" value="home" />
            <Divider />
            <Subheader>Teams</Subheader>
            {currentUser.organizations.map((organization) => (
              <OrganizationItem
                key={organization.id}
                organization={organization}
                client={client}
                history={history}
              />
            ))}
            <Divider />
            <Subheader>Help</Subheader>
            <MenuItem
              {...dataTest("docs")}
              primaryText="Documentation"
              value="docs"
              rightIcon={<OpenInNewIcon />}
            />
            <Divider />
            <MenuItem
              {...dataTest("userMenuLogOut")}
              primaryText="Log out"
              value="logout"
            />
          </Menu>
        </Popover>
      </div>
    );
  }
}

const queries: QueryMap<Props> = {
  data: {
    query: gql`
      query getCurrentUserForMenu {
        currentUser {
          id
          displayName
          email
          organizations {
            id
            name
          }
        }
      }
    `,
    options: {
      fetchPolicy: "network-only"
    }
  }
};

export default compose(
  withApollo,
  withRouter,
  withOperations({ queries })
)(UserMenu);
