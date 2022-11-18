import { makeStyles } from "@material-ui/core";
import IconButton from "@material-ui/core/IconButton";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import TableCell from "@material-ui/core/TableCell";
import TableRow from "@material-ui/core/TableRow";
import Tooltip from "@material-ui/core/Tooltip";
import Typography from "@material-ui/core/Typography";
import BlockIcon from "@material-ui/icons/Block";
import EditIcon from "@material-ui/icons/Edit";
import LinkOffIcon from "@material-ui/icons/LinkOff";
import LockIcon from "@material-ui/icons/Lock";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import PersonAddIcon from "@material-ui/icons/PersonAdd";
import RemoveCircleOutlineIcon from "@material-ui/icons/RemoveCircleOutline";
import type { OrganizationMembership, User } from "@spoke/spoke-codegen";
import { DropDownMenu, MenuItem as MenuItemV0 } from "material-ui";
import React, { useCallback, useState } from "react";

import {
  RequestAutoApproveType,
  UserRoleType
} from "../../../api/organization-membership";
import { snakeToTitleCase, titleCase } from "../../../lib/attributes";
import { hasRoleAtLeast } from "../../../lib/permissions";
import { useAuthzContext } from "../../AuthzProvider";
import type {
  AdminPeopleContext,
  CurrentUser,
  PeopleRowEventHandlers
} from "./context";

interface PeopleRowContext {
  row: {
    membership: OrganizationMembership;
    user: User;
    isOwner: boolean;
    isViewingUser: boolean;
  };
  viewing: {
    user: CurrentUser;
    role: UserRoleType;
    isOwner: boolean;
  };
}

interface RoleSelectProps {
  context: PeopleRowContext;
  onSelect: (newRole: UserRoleType) => void;
}
const RoleSelect: React.FC<RoleSelectProps> = ({
  context: { row, viewing },
  onSelect
}) => {
  const disableRoleEdit =
    row.isViewingUser ||
    (row.isOwner && !hasRoleAtLeast(viewing.role, UserRoleType.OWNER));

  return (
    <DropDownMenu
      value={row.membership.role}
      style={{ display: "inherit" }}
      underlineStyle={{ display: "none" }}
      disabled={disableRoleEdit}
      onChange={(_, __, newRole: UserRoleType) => onSelect(newRole)}
    >
      {[
        UserRoleType.SUSPENDED,
        UserRoleType.TEXTER,
        UserRoleType.SUPERVOLUNTEER,
        UserRoleType.ADMIN,
        UserRoleType.OWNER,
        UserRoleType.SUPERADMIN
      ].map((option) => (
        <MenuItemV0
          key={option}
          value={option}
          disabled={
            (option === UserRoleType.OWNER &&
              !hasRoleAtLeast(viewing.role, UserRoleType.OWNER)) ||
            (option === UserRoleType.SUPERADMIN &&
              viewing.role !== UserRoleType.SUPERADMIN)
          }
          primaryText={titleCase(option)}
        />
      ))}
    </DropDownMenu>
  );
};

interface AutoApproveSelectProps {
  context: PeopleRowContext;
  onChange: (autoApprove: RequestAutoApproveType) => void;
}
const AutoApproveSelect: React.FC<AutoApproveSelectProps> = ({
  context: { row, viewing },
  onChange
}) => {
  return (
    <DropDownMenu
      value={row.membership.requestAutoApprove}
      disabled={!hasRoleAtLeast(viewing.role, UserRoleType.ADMIN)}
      style={{ display: "inherit" }}
      underlineStyle={{ display: "none" }}
      onChange={(_, __, autoApprove: RequestAutoApproveType) =>
        onChange(autoApprove)
      }
    >
      {[
        RequestAutoApproveType.APPROVAL_REQUIRED,
        RequestAutoApproveType.AUTO_APPROVE,
        RequestAutoApproveType.DO_NOT_APPROVE
      ].map((option) => (
        <MenuItemV0
          key={option}
          value={option}
          disabled={false}
          primaryText={snakeToTitleCase(option)}
        />
      ))}
    </DropDownMenu>
  );
};

const useStyles = makeStyles((_theme) => ({
  wrapIcon: {
    verticalAlign: "middle",
    display: "inline-flex"
  }
}));

interface PeopleRowProps {
  context: AdminPeopleContext;
  membership: OrganizationMembership;
  handlers: PeopleRowEventHandlers;
}

type PeopleRowExtendedProps = PeopleRowProps;

const PeopleRow: React.FC<PeopleRowExtendedProps> = ({
  membership,
  context: {
    viewing: { user: viewingUser }
  },
  handlers
}) => {
  const classes = useStyles();
  const auth = useAuthzContext();
  const [menuAnchor, setMenuAnchor] = useState<HTMLButtonElement | null>(null);
  const context: PeopleRowContext = {
    row: {
      membership,
      user: membership.user,
      isOwner: membership.role === UserRoleType.OWNER,
      isViewingUser: membership.user.id === viewingUser.id
    },
    viewing: {
      user: viewingUser,
      role: viewingUser.memberships.edges[0].node.role,
      isOwner: viewingUser.memberships.edges[0].node.role === UserRoleType.OWNER
    }
  };

  const { row, viewing } = context;

  const handleEditRole = useCallback(
    (role: UserRoleType) =>
      handlers.editMembershipRole(role, row.membership.id),
    [handlers.editMembershipRole, row.membership.id]
  );

  const handleEditAutoApprove = useCallback(
    (autoApprove: RequestAutoApproveType) =>
      handlers.editAutoApprove(autoApprove, row.membership.id),
    [handlers.editAutoApprove, row.membership.id]
  );

  const handleClickEdit = useCallback(() => {
    handlers.startEdit(row.user.id);
  }, [handlers.startEdit, row.user.id]);

  const handleToggleSuspend = useCallback(() => {
    handlers.setSuspended(row.user.id, !row.user.isSuspended);
  }, [handlers.setSuspended, row.user.id, row.user.isSuspended]);

  const handleClearSessions = useCallback(() => {
    handlers.clearSessions(row.user.id);
  }, [handlers.clearSessions, row.user.id]);

  const handleClickReset = useCallback(() => {
    handlers.resetUserPassword(row.user.id);
  }, [handlers.resetUserPassword, row.user.id]);

  const handleClickMenu = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) =>
      setMenuAnchor(event.currentTarget),
    [setMenuAnchor]
  );

  const handleCloseMenu = useCallback(() => setMenuAnchor(null), [
    setMenuAnchor
  ]);

  return (
    <TableRow hover>
      <TableCell style={{ verticalAlign: "middle" }}>
        <Typography variant="body2" className={classes.wrapIcon}>
          {row.user.isSuspended && (
            <Tooltip title="Suspended">
              <BlockIcon />
            </Tooltip>
          )}
          &nbsp;
          {row.user.displayName}
        </Typography>
      </TableCell>
      <TableCell>{row.user.email}</TableCell>
      <TableCell>
        <RoleSelect context={context} onSelect={handleEditRole} />
      </TableCell>

      <TableCell>
        <AutoApproveSelect context={context} onChange={handleEditAutoApprove} />
      </TableCell>
      <TableCell>
        <IconButton aria-label="people-row-menu" onClick={handleClickMenu}>
          <MoreVertIcon />
        </IconButton>
        <Menu
          anchorEl={menuAnchor}
          open={menuAnchor !== null}
          onClose={handleCloseMenu}
        >
          <MenuItem onClick={handleClickEdit}>
            <ListItemIcon>
              <EditIcon />
            </ListItemIcon>
            Edit
          </MenuItem>
          <MenuItem
            disabled={!auth.isSuperadmin || viewing.user.id === row.user.id}
            onClick={handleToggleSuspend}
          >
            <ListItemIcon>
              {row.user.isSuspended ? (
                <PersonAddIcon />
              ) : (
                <RemoveCircleOutlineIcon />
              )}
            </ListItemIcon>
            {row.user.isSuspended ? "Unsuspend" : "Suspend"}
          </MenuItem>
          <MenuItem
            disabled={!auth.isSuperadmin || viewing.user.id === row.user.id}
            onClick={handleClearSessions}
          >
            <ListItemIcon>
              <LinkOffIcon />
            </ListItemIcon>
            Clear Sessions
          </MenuItem>
          {window.PASSPORT_STRATEGY === "local" && (
            <MenuItem
              disabled={viewing.user.id === row.user.id}
              onClick={handleClickReset}
            >
              <ListItemIcon>
                <LockIcon />
              </ListItemIcon>
              Reset Password
            </MenuItem>
          )}
        </Menu>
      </TableCell>
    </TableRow>
  );
};

export default PeopleRow;
