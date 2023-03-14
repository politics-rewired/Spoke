import Avatar from "@material-ui/core/Avatar";
import Divider from "@material-ui/core/Divider";
import IconButton from "@material-ui/core/IconButton";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";
import { useGetCurrentUserForMenuQuery } from "@spoke/spoke-codegen";
import React, { useCallback, useRef, useState } from "react";
import { useHistory } from "react-router-dom";

import { dataTest } from "../../lib/attributes";
import { useAuthzContext } from "../AuthzProvider";
import OrganizationItem from "./components/OrganizationItem";

interface Props {
  organizationId?: string;
}

const UserMenu: React.FC<Props> = (props) => {
  const { organizationId } = props;

  const [open, setOpen] = useState(false);
  const { isSuperadmin } = useAuthzContext();
  const anchorRef = useRef(null);
  const { data } = useGetCurrentUserForMenuQuery({
    fetchPolicy: "network-only"
  });
  const history = useHistory();

  const currentUser = data?.currentUser;

  // Use `any` because of mismatch between @types/react versions
  const handleClickMenuAnchor = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.preventDefault();
      setOpen(true);
    },
    [setOpen]
  );

  const handleRequestClose = useCallback(() => setOpen(false), [setOpen]);

  const onNavigateFactory = (value: string) => () => {
    handleRequestClose();

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
      if (organizationId && currentUser) {
        history.push(`/app/${organizationId}/account/${currentUser.id}`);
      }
    } else if (value === "home") {
      history.push(`/app/${organizationId}/todos`);
    } else if (value === "superadmin") {
      history.push(`/superadmin/people`);
    } else if (value === "docs") {
      window.open("https://docs.spokerewired.com", "_blank");
    }
  };

  if (!currentUser) {
    return <div />;
  }

  const userInitals = currentUser.displayName
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2);

  return (
    <>
      <IconButton
        ref={anchorRef}
        {...dataTest("userMenuButton")}
        onClick={handleClickMenuAnchor}
      >
        <Avatar>{userInitals}</Avatar>
      </IconButton>
      <Menu
        open={open}
        anchorEl={anchorRef.current}
        anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
        transformOrigin={{ horizontal: "left", vertical: "top" }}
        onClose={handleRequestClose}
      >
        <MenuItem
          disabled={!organizationId}
          onClick={onNavigateFactory("account")}
        >
          <ListItemIcon>
            <Avatar>{userInitals}</Avatar>
          </ListItemIcon>
          <ListItemText
            primary={currentUser.displayName}
            secondary={currentUser.email}
          />
        </MenuItem>
        <Divider />
        <MenuItem
          disabled={!organizationId}
          onClick={onNavigateFactory("home")}
        >
          Home
        </MenuItem>
        {isSuperadmin && (
          <MenuItem onClick={onNavigateFactory("superadmin")}>
            Superadmin
          </MenuItem>
        )}
        <Divider />
        <ListSubheader>Teams</ListSubheader>
        {currentUser?.organizations?.map((organization) => (
          <OrganizationItem
            key={organization!.id}
            organizationId={organization!.id!}
            organizationName={organization!.name!}
            history={history}
          />
        ))}
        <Divider />
        <ListSubheader>Help</ListSubheader>
        <MenuItem {...dataTest("docs")} onClick={onNavigateFactory("docs")}>
          <ListItemText primary="Documentation" />
          <ListItemSecondaryAction>
            <OpenInNewIcon />
          </ListItemSecondaryAction>
        </MenuItem>
        <Divider />
        <MenuItem
          {...dataTest("userMenuLogOut")}
          onClick={onNavigateFactory("logout")}
        >
          Log out
        </MenuItem>
      </Menu>
    </>
  );
};

export default UserMenu;
