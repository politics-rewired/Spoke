import {
  DropDownMenu,
  FlatButton,
  MenuItem,
  TableRow,
  TableRowColumn
} from "material-ui";
import React from "react";

import {
  OrganizationMembership,
  RequestAutoApproveType,
  UserRoleType
} from "../../api/organization-membership";
import { User } from "../../api/user";
import { dataTest, snakeToTitleCase, titleCase } from "../../lib/attributes";
import { hasRoleAtLeast } from "../../lib/permissions";
import {
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
const RoleSelect: React.StatelessComponent<RoleSelectProps> = ({
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
        UserRoleType.TEXTER,
        UserRoleType.SUPERVOLUNTEER,
        UserRoleType.ADMIN,
        UserRoleType.OWNER,
        UserRoleType.SUPERADMIN
      ].map((option) => (
        <MenuItem
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
const AutoApproveSelect: React.StatelessComponent<AutoApproveSelectProps> = ({
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
        <MenuItem
          key={option}
          value={option}
          disabled={false}
          primaryText={snakeToTitleCase(option)}
        />
      ))}
    </DropDownMenu>
  );
};

interface PeopleRowExtensionProps {
  history: History;
}

interface PeopleRowProps {
  context: AdminPeopleContext;
  membership: OrganizationMembership;
  handlers: PeopleRowEventHandlers;
}

type PeopleRowExtendedProps = PeopleRowProps & PeopleRowExtensionProps;

const PeopleRow: React.StatelessComponent<PeopleRowExtendedProps> = ({
  membership,
  context: {
    viewing: { user: viewingUser }
  },
  handlers
}) => {
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

  return (
    <TableRow>
      <TableRowColumn>{row.user.displayName}</TableRowColumn>
      <TableRowColumn>{row.user.email}</TableRowColumn>
      <TableRowColumn>
        <RoleSelect
          context={context}
          onSelect={(role) => handlers.editRole(role, row.user.id)}
        />
      </TableRowColumn>

      <TableRowColumn>
        <AutoApproveSelect
          context={context}
          onChange={(autoApprove) =>
            handlers.editAutoApprove(autoApprove, row.user.id)
          }
        />
      </TableRowColumn>
      <TableRowColumn>
        <FlatButton
          {...dataTest("editPerson")}
          label="Edit"
          onClick={() => handlers.startEdit(row.user.id)}
        />
      </TableRowColumn>
      {window.PASSPORT_STRATEGY === "local" && (
        <TableRowColumn>
          <FlatButton
            label="Reset Password"
            disabled={viewing.user.id === row.user.id}
            onClick={() => handlers.resetUserPassword(row.user.id)}
          />
        </TableRowColumn>
      )}
    </TableRow>
  );
};

export default PeopleRow;
