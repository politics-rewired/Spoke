import React, { useContext, useEffect } from "react";
import { useParams } from "react-router-dom";

import { useCurrentUserOrganizationRolesQuery } from "../../libs/spoke-codegen/src";
import { UserRoleType } from "../api/organization-membership";
import { useSpokeContext } from "../client/spoke-context";
import { hasRole } from "../lib/permissions";

export const AuthzContext = React.createContext(false);

export const AuthzProvider: React.FC<{ organizationId: string }> = (props) => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const { data, loading } = useCurrentUserOrganizationRolesQuery({
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
    if (!loading && !hasAdminPermissions) {
      const loginUrl = `/login?nextUrl=${window.location.pathname}`;
      // We can't use replace(...) here because /login is not a react-router path
      window.location.href = loginUrl;
    }
  }, [loading, hasAdminPermissions]);

  if (loading) return null;

  return (
    <AuthzContext.Provider value={hasAdminPermissions}>
      {props.children}
    </AuthzContext.Provider>
  );
};

export const useAuthzContext = () => useContext(AuthzContext);

export const withAuthzContext = <P extends unknown>(
  Component: React.ComponentType<P & { adminPerms: boolean }>
) => {
  const ComponentWithAuthzContext: React.FC<P> = (props) => {
    const adminPerms = useAuthzContext();
    return <Component {...props} adminPerms={adminPerms} />;
  };

  return ComponentWithAuthzContext;
};

export default AuthzContext;
