import { UserRoleType } from "../api/organization-membership";

export const ROLE_HIERARCHY = [
  UserRoleType.SUSPENDED,
  UserRoleType.TEXTER,
  UserRoleType.SUPERVOLUNTEER,
  UserRoleType.ADMIN,
  UserRoleType.OWNER,
  UserRoleType.SUPERADMIN
];

export const isRoleGreater = (
  role1: UserRoleType,
  role2: UserRoleType
): boolean => ROLE_HIERARCHY.indexOf(role1) > ROLE_HIERARCHY.indexOf(role2);

export const hasRoleAtLeast = (
  hasRole: UserRoleType,
  wantsRole: UserRoleType
) => ROLE_HIERARCHY.indexOf(hasRole) >= ROLE_HIERARCHY.indexOf(wantsRole);

export const getHighestRole = (roles: UserRoleType[]) =>
  roles.sort(
    (roleA: UserRoleType, roleB: UserRoleType) =>
      ROLE_HIERARCHY.indexOf(roleA) - ROLE_HIERARCHY.indexOf(roleB)
  )[roles.length - 1];

export const hasRole = (role: UserRoleType, roles: UserRoleType[]) =>
  hasRoleAtLeast(getHighestRole(roles), role);
