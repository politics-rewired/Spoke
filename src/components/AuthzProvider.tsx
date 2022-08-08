import {
  useCurrentUserOrganizationRolesQuery,
  useCurrentUserSuperAdminQuery
} from "@spoke/spoke-codegen";
import React, { useContext, useEffect } from "react";

import { UserRoleType } from "../api/organization-membership";
import { useSpokeContext } from "../client/spoke-context";
import { hasRole } from "../lib/permissions";

export interface AuthzContextType {
  roles: UserRoleType[];
  hasRole: (role: UserRoleType) => boolean;
  isSuperadmin: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isSupervol: boolean;
}

export const AuthzContext = React.createContext<AuthzContextType>({
  roles: [],
  hasRole: () => false,
  isSuperadmin: false,
  isOwner: false,
  isAdmin: false,
  isSupervol: false
});

export const AuthzProvider: React.FC<{ organizationId?: string }> = ({
  organizationId,
  children
}) => {
  const { data, loading, error } = organizationId
    ? useCurrentUserOrganizationRolesQuery({
        variables: { organizationId }
      })
    : useCurrentUserSuperAdminQuery();
  const roles = (data?.currentUser?.roles ?? []) as UserRoleType[];
  const isSuperadmin = data?.currentUser?.isSuperadmin ?? false;
  const hasAdminPermissions =
    isSuperadmin || hasRole(UserRoleType.ADMIN, roles);

  const { setOrganizationId } = useSpokeContext();

  useEffect(() => {
    setOrganizationId(organizationId);
  }, [organizationId]);

  useEffect(() => {
    if (!loading && error !== undefined) {
      const loginUrl = `/login?nextUrl=${window.location.pathname}`;
      // We can't use replace(...) here because /login is not a react-router path
      window.location.href = loginUrl;
    }
  }, [loading, hasAdminPermissions, error]);

  const value = React.useMemo(
    () => ({
      roles,
      hasRole: (role: UserRoleType) => hasRole(role, roles),
      isSuperadmin,
      isOwner: hasRole(UserRoleType.OWNER, roles),
      isAdmin: hasRole(UserRoleType.ADMIN, roles),
      isSupervol: hasRole(UserRoleType.SUPERVOLUNTEER, roles)
    }),
    [roles]
  );

  if (loading) return null;
  return (
    <AuthzContext.Provider value={value}>{children}</AuthzContext.Provider>
  );
};

export const useAuthzContext = () => useContext(AuthzContext);

export const withAuthzContext = <P,>(
  Component: React.ComponentType<P & AuthzContextType>
) => {
  const ComponentWithAuthzContext: React.FC<P> = (props) => {
    const authzProps = useAuthzContext();
    return <Component {...props} {...authzProps} />;
  };

  return ComponentWithAuthzContext;
};

export default AuthzContext;
