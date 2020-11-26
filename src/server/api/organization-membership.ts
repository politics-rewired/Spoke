import { r } from "../models";
import { sqlResolvers } from "./lib/utils";

interface IOrganizationMembership {
  user_id: number;
  organization_id: number;
  request_status: string;
  user?: Record<string, unknown>;
  organization?: Record<string, unknown>;
}

export const resolvers = {
  OrganizationMembership: {
    ...sqlResolvers(["id", "role"]),
    user: async (membership: IOrganizationMembership) =>
      membership.user
        ? membership.user
        : r.reader("user").where({ id: membership.user_id }).first(),
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

export default resolvers;
