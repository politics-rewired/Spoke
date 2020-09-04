import { GraphQLError } from "graphql/error";
import { r } from "../models";
import { memoizer, cacheOpts } from "../memoredis";

const accessHierarchy = ["TEXTER", "SUPERVOLUNTEER", "ADMIN", "OWNER"];

export function authRequired(user) {
  if (!user) {
    throw new GraphQLError({
      status: 401,
      message: "You must login to access that resource."
    });
  }
}

const getUserRole = memoizer.memoize(async ({ userId, organizationId }) => {
  const user_organization = await r
    .reader("user_organization")
    .where({ user_id: userId, organization_id: organizationId })
    .first("role");

  return user_organization.role;
}, cacheOpts.GetUserOrganization);

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
    throw new GraphQLError("You are not authorized to access that resource.");
  }
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
    throw new GraphQLError("You are not authorized to access that resource.");
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
      throw new GraphQLError("You are not authorized to access that resource.");
    }
  }
}

export function superAdminRequired(user) {
  authRequired(user);

  if (!user.is_superadmin) {
    throw new GraphQLError("You are not authorized to access that resource.");
  }
}
