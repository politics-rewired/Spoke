import { sqlResolvers } from "./lib/utils";
import { r } from "../models";

interface IOrganizationMembership {
  user_id: number;
  organization_id: number;
  request_status: string;
  user?: {};
  organization?: {};
}

export const resolvers = {
  OrganizationMembership: {
    ...sqlResolvers(["id", "role"]),
    user: async (membership: IOrganizationMembership) =>
      membership.user
        ? membership.user
        : r
            .reader("user")
            .where({ id: membership.user_id })
            .first(),
    organization: async (membership: IOrganizationMembership) =>
      membership.organization
        ? membership.organization
        : r
            .reader("organization")
            .where({ id: membership.organization_id })
            .first(),
    requestAutoApprove: (membership: IOrganizationMembership) =>
      membership.request_status.toUpperCase()
  }
};
