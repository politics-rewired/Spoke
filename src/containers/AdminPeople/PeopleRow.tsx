/* eslint-disable no-unused-vars */
import { FetchResult } from "apollo-link";
import gql from "graphql-tag";
import { get } from "lodash/";
import {
  DropDownMenu,
  FlatButton,
  MenuItem,
  TableRow,
  TableRowColumn
} from "material-ui";
import React from "react";
import { compose } from "recompose";

import {
  OrganizationMembership,
  RequestAutoApproveType,
  UserRoleType
} from "../../api/organization-membership";
import { User } from "../../api/user";
import { dataTest, snakeToTitleCase, titleCase } from "../../lib/attributes";
import { hasRoleAtLeast } from "../../lib/permissions";
import { loadData } from "../hoc/with-operations";
import {
  AdminPeopleContext,
  CurrentUser,
  PersonMutationHandler
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
    row.isViewingUser || (row.isOwner && !viewing.isOwner);

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
        UserRoleType.OWNER
      ].map((option) => (
        <MenuItem
          key={option}
          value={option}
          disabled={option === UserRoleType.OWNER && !viewing.isOwner}
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
  mutations: {
    editOrganizationMembership: ({
      autoApprove,
      role
    }: {
      autoApprove?: RequestAutoApproveType;
      role?: UserRoleType;
    }) => Promise<
      FetchResult<{
        id: string;
        role: UserRoleType;
        requestAutoApprove: RequestAutoApproveType;
      }>
    >;
    resetUserPassword: () => Promise<
      FetchResult<{
        resetUserPassword: string;
      }>
    >;
  };
}

interface PeopleRowProps {
  context: AdminPeopleContext;
  membership: OrganizationMembership;
  on: PersonMutationHandler;
}

type PeopleRowExtendedProps = PeopleRowProps & PeopleRowExtensionProps;

const PeopleRow: React.StatelessComponent<PeopleRowExtendedProps> = ({
  membership,
  context: {
    viewing: { user: viewingUser }
  },
  mutations: { editOrganizationMembership, resetUserPassword },
  on
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
          onSelect={async (role) => {
            await editOrganizationMembership({
              role
            });
            on.wasUpdated(row.user.id);
          }}
        />
      </TableRowColumn>

      <TableRowColumn>
        <AutoApproveSelect
          context={context}
          onChange={async (autoApprove) => {
            await editOrganizationMembership({
              autoApprove
            });
            on.wasUpdated(row.user.id);
          }}
        />
      </TableRowColumn>
      <TableRowColumn>
        <FlatButton
          {...dataTest("editPerson")}
          label="Edit"
          onClick={() => on.startEdit(row.user.id)}
        />
      </TableRowColumn>
      {get(window, "PASSPORT_STRATEGY", "") === "local" && (
        <TableRowColumn>
          <FlatButton
            label="Reset Password"
            disabled={viewing.user.id === row.user.id}
            onClick={async () => {
              const { data } = await resetUserPassword();
              if (data) {
                const hash = data.resetUserPassword;
                on.createHash(hash);
              }
            }}
          />
        </TableRowColumn>
      )}
    </TableRow>
  );
};

const mutations = {
  editOrganizationMembership: (props: PeopleRowProps) => ({
    autoApprove,
    role
  }: {
    autoApprove?: RequestAutoApproveType;
    role?: UserRoleType;
  }) => ({
    mutation: gql`
      mutation editOrganizationMembership(
        $membershipId: String!
        $level: RequestAutoApprove
        $role: String
      ) {
        editOrganizationMembership(
          id: $membershipId
          level: $level
          role: $role
        ) {
          id
          role
          requestAutoApprove
        }
      }
    `,
    variables: {
      membershipId: props.membership.id,
      level: autoApprove,
      role
    }
  }),
  resetUserPassword: ({
    context: { organization },
    membership: { user }
  }: PeopleRowProps) => () => {
    return {
      mutation: gql`
        mutation resetUserPassword($organizationId: String!, $userId: Int!) {
          resetUserPassword(organizationId: $organizationId, userId: $userId)
        }
      `,
      variables: {
        organizationId: organization.id,
        userId: user.id
      }
    };
  }
};
export default compose<PeopleRowExtendedProps, PeopleRowProps>(
  loadData({ mutations })
)(PeopleRow);
