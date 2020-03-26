import { sqlResolvers } from "./lib/utils";
import { r } from "../models";
import { RequestAutoApproveType } from "../../api/organization-membership";

const pgToGql = {
  do_not_approve: RequestAutoApproveType.DO_NOT_APPROVE,
  approval_required: RequestAutoApproveType.APPROVAL_REQUIRED,
  auto_approve: RequestAutoApproveType.AUTO_APPROVE
};

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
    requestAutoApprove: membership => pgToGql[membership.request_status]
  }
};
