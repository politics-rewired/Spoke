import { useCurrentUserOrganizationRolesQuery } from "@spoke/spoke-codegen";
import React, { useContext, useEffect } from "react";
import { useParams } from "react-router-dom";

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

export const AuthzProvider: React.FC<{ organizationId: string }> = (props) => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const { data, loading, error } = useCurrentUserOrganizationRolesQuery({
    variables: { organizationId: props.organizationId },
    skip: props.organizationId === undefined
  });
  const roles = (data?.currentUser?.roles ?? []) as UserRoleType[];
  const hasAdminPermissions = hasRole(UserRoleType.ADMIN, roles);

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
      isSuperadmin: hasRole(UserRoleType.SUPERADMIN, roles),
      isOwner: hasRole(UserRoleType.OWNER, roles),
      isAdmin: hasRole(UserRoleType.ADMIN, roles),
      isSupervol: hasRole(UserRoleType.SUPERVOLUNTEER, roles)
    }),
    [roles]
  );

  if (loading) return null;
  return (
    <AuthzContext.Provider value={value}>
      {props.children}
    </AuthzContext.Provider>
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
