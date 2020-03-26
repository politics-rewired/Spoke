import { sqlResolvers } from "./lib/utils";
import { r } from "../models";

export const resolvers = {
  OrganizationMembership: {
    ...sqlResolvers(["id", "role"]),
    user: async membership =>
      membership.user
        ? membership.user
        : r
            .reader("user")
            .where({ id: membership.user_id })
            .first(),
    organization: async membership =>
      membership.organization
        ? membership.organization
        : r
            .reader("organization")
            .where({ id: membership.organization_id })
            .first(),
    requestAutoApprove: membership => membership.request_status.toUpperCase()
  }
};
