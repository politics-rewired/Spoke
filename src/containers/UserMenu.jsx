import PropTypes from "prop-types";
import React, { Component } from "react";
import Popover from "material-ui/Popover";
import Menu from "material-ui/Menu";
import MenuItem from "material-ui/MenuItem";
import Divider from "material-ui/Divider";
import Subheader from "material-ui/Subheader";
import IconButton from "material-ui/IconButton";
import Avatar from "material-ui/Avatar";
import { connect } from "react-apollo";
import { withRouter } from "react-router";
import gql from "graphql-tag";
import { dataTest } from "../lib/attributes";
import { hasRole } from "../lib/permissions";

const avatarSize = 28;

const OrganizationItemInner = props => {
  const { organization, data, router } = props;
  const { loading, currentUser } = data;
  const path =
    data.currentUser && hasRole("SUPERVOLUNTEER", currentUser.roles)
      ? `/admin/${organization.id}`
      : `/app/${organization.id}`;

  const handleClick = event => {
    event.preventDefault();
    router.push(path);
  };

  return (
    <MenuItem
      primaryText={organization.name}
      value={path}
      disabled={loading}
      onClick={handleClick}
    />
  );
};

const orgRoleProps = ({ ownProps }) => ({
  data: {
    query: gql`
      query getCurrentUserRoles($organizationId: String!) {
        currentUser {
          id
          roles(organizationId: $organizationId)
        }
      }
    `,
    variables: {
      organizationId: ownProps.organization.id
    }
  }
});

const OrganizationItem = connect({
  mapQueriesToProps: orgRoleProps
})(withRouter(OrganizationItemInner));

class UserMenu extends Component {
  state = {
    open: false,
    anchorEl: null
  };

  handleTouchTap = event => {
    // This prevents ghost click.
    event.preventDefault();

    this.setState({
      open: true,
      anchorEl: event.currentTarget
    });
  };

  handleRequestClose = () => this.setState({ open: false });

  handleMenuChange = (_, value) => {
    const { orgId, data, router } = this.props;
    const { currentUser } = data;

    this.handleRequestClose();

    // Handle only named routes (org navigation is done in OrganizationItem
    // becase MenuItem change is only handled if it's a direct descendent of Menu)
    if (value === "logout") {
      window.AuthService.logout();
    } else if (value === "account") {
      if (orgId) {
        router.push(`/app/${orgId}/account/${currentUser.id}`);
      }
    } else if (value === "home") {
      router.push(`/app/${orgId}/todos`);
    } else if (value === "faqs") {
      router.push(`/app/${orgId}/faqs`);
    }
  };

  renderAvatar(user, size) {
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
  }

  render() {
    const { orgId, data } = this.props;
    const { currentUser } = data;

    if (!currentUser) {
      return <div />;
    }

    const { open, anchorEl } = this.state;

    return (
      <div>
        <IconButton
          {...dataTest("userMenuButton")}
          onTouchTap={this.handleTouchTap}
          iconStyle={{ fontSize: "18px" }}
        >
          {this.renderAvatar(currentUser, avatarSize)}
        </IconButton>
        <Popover
          open={open}
          anchorEl={anchorEl}
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
              value={"account"}
            >
              {currentUser.email}
            </MenuItem>
            <Divider />
            <Subheader>Teams</Subheader>
            {currentUser.organizations.map(organization => (
              <OrganizationItem
                key={organization.id}
                organization={organization}
              />
            ))}
            <Divider />
            <MenuItem {...dataTest("home")} primaryText="Home" value="home" />
            <MenuItem {...dataTest("faqs")} primaryText="FAQs" value="faqs" />
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

UserMenu.propTypes = {
  data: PropTypes.object,
  orgId: PropTypes.string,
  router: PropTypes.object
};

const mapQueriesToProps = () => ({
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
    forceFetch: true
  }
});

export default connect({
  mapQueriesToProps
})(withRouter(UserMenu));
