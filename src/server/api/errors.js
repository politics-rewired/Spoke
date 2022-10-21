import { AuthenticationError, ForbiddenError } from "apollo-server-express";

import { UserRoleType } from "../../api/organization-membership";
import { r } from "../models";

const accessHierarchy = ["TEXTER", "SUPERVOLUNTEER", "ADMIN", "OWNER"];

export const roleIndex = (role) => accessHierarchy.indexOf(role);

export function authRequired(user) {
  if (!user) {
    throw new AuthenticationError("You must login to access that resource.");
  }
}

const getUserRole = async ({ userId, organizationId }) => {
  const user_organization = await r
    .reader("user_organization")
    .where({ user_id: userId, organization_id: organizationId })
    .first("role");

  return user_organization.role;
};

export async function accessRequired(
  user,
  orgId,
  role,
  allowSuperadmin = false
) {
  authRequired(user);
  if (!orgId) {
    throw new Error("orgId not passed correctly to accessRequired");
  }

  if (allowSuperadmin && user.is_superadmin) {
    return;
  }
  // require a permission at-or-higher than the permission requested
  const userRole = await getUserRole({
    userId: user.id,
    organizationId: orgId
  });

  const hasRole =
    accessHierarchy.indexOf(userRole) >= accessHierarchy.indexOf(role);

  if (!hasRole) {
    throw new ForbiddenError("You are not authorized to access that resource.");
  }
}

export async function userRoleRequired(user, orgId, role) {
  authRequired(user);
  if (role === UserRoleType.SUPERADMIN && user.is_superadmin !== true) {
    throw new ForbiddenError("You are not authorized to access that resource.");
  }
  await accessRequired(user, orgId, role);
}

export async function assignmentRequired(user, assignmentId) {
  authRequired(user);

  if (user.is_superadmin) {
    return;
  }

  const [assignment] = await r
    .reader("assignment")
    .where({
      user_id: user.id,
      id: assignmentId
    })
    .limit(1);

  if (typeof assignment === "undefined") {
    throw new ForbiddenError("You are not authorized to access that resource.");
  }
}

export async function assignmentRequiredOrHasOrgRoleForCampaign(
  user,
  assignmentId,
  campaignId,
  role
) {
  authRequired(user);

  if (user.is_superadmin) {
    return;
  }

  const [assignment] = await r
    .reader("assignment")
    .where({
      user_id: user.id,
      id: assignmentId
    })
    .limit(1);

  if (typeof assignment === "undefined") {
    const [campaign] = await r
      .reader("campaign")
      .where({ id: campaignId })
      .select("organization_id");

    const userRole = await getUserRole({
      userId: user.id,
      organizationId: campaign.organization_id
    });

    const hasRole =
      accessHierarchy.indexOf(userRole) >= accessHierarchy.indexOf(role);

    if (!hasRole) {
      throw new ForbiddenError(
        "You are not authorized to access that resource."
      );
    }
  }
}

export function superAdminRequired(user) {
  authRequired(user);

  if (!user.is_superadmin) {
    throw new ForbiddenError("You are not authorized to access that resource.");
  }
}
