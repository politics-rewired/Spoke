import MenuItem from "@material-ui/core/MenuItem";
import { useGetCurrentUserRolesQuery } from "@spoke/spoke-codegen";
import React from "react";
import type { RouterProps } from "react-router-dom";

import { UserRoleType } from "../../../api/organization-membership";
import { hasRole } from "../../../lib/permissions";

// Accept history as passed prop because we cannot use withRouter within UserMenu's Popover
// (Popover content exists outside of <BrowserRouter> context)
interface Props extends Pick<RouterProps, "history"> {
  organizationId: string;
  organizationName: string;
}

const OrganizationItemInner: React.FC<Props> = (props) => {
  const { organizationId, organizationName, history } = props;

  const { data, loading } = useGetCurrentUserRolesQuery({
    variables: { organizationId }
  });
  const roles = (data?.currentUser?.roles as unknown) as
    | UserRoleType[]
    | undefined;

  const path =
    !loading &&
    roles !== undefined &&
    hasRole(UserRoleType.SUPERVOLUNTEER, roles)
      ? `/admin/${organizationId}`
      : `/app/${organizationId}`;

  // Use `any` because of mismatch between @types/react versions
  const handleClick = (event: any) => {
    event.preventDefault();
    history.push(path);
  };

  return (
    <MenuItem value={path} disabled={loading} onClick={handleClick}>
      {organizationName}
    </MenuItem>
  );
};

export default OrganizationItemInner;
