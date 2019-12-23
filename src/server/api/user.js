import { sqlResolvers } from "./lib/utils";
import { r } from "../models";
import { addCampaignsFilterToQuery } from "./campaign";
import { myCurrentAssignmentTarget } from "./assignment";

export function buildUserOrganizationQuery(
  queryParam,
  organizationId,
  role,
  campaignId,
  offset
) {
  const roleFilter = role ? { role } : {};

  queryParam
    .from("user_organization")
    .innerJoin("user", "user_organization.user_id", "user.id")
    .where(roleFilter)
    .where({ "user_organization.organization_id": organizationId })
    .distinct();

  if (campaignId) {
    queryParam
      .innerJoin("assignment", "assignment.user_id", "user.id")
      .where({ "assignment.campaign_id": campaignId });
  }
  if (typeof offset == "number") {
    queryParam.offset(offset);
  }
  return queryParam;
}

function buildUsersQuery(queryParam, organizationId, campaignsFilter, role) {
  let query = undefined;
  if (campaignsFilter) {
    query = queryParam
      .from("assignment")
      .join("user", "assignment.user_id", "user.id")
      .join("user_organization", "user.id", "user_organization.user_id")
      .join("campaign", "assignment.campaign_id", "campaign.id")
      .where("user_organization.organization_id", organizationId)
      .distinct();

    if (role) {
      query = query.where("user_organization.role", role);
    }

    return addCampaignsFilterToQuery(query, campaignsFilter);
  }

  return buildUserOrganizationQuery(queryParam, organizationId, role);
}

export async function getUsers(organizationId, cursor, campaignsFilter, role) {
  let usersQuery = buildUsersQuery(
    r.knex.select("user.*"),
    organizationId,
    campaignsFilter,
    role
  );
  usersQuery = usersQuery
    .orderBy("first_name")
    .orderBy("last_name")
    .orderBy("id");

  if (cursor) {
    usersQuery = usersQuery.limit(cursor.limit).offset(cursor.offset);
    const users = await usersQuery;

    const usersCountQuery = buildUsersQuery(
      r.knex.countDistinct("user.id"),
      organizationId,
      campaignsFilter,
      role
    );

    const usersCount = await r.parseCount(usersCountQuery);
    const pageInfo = {
      limit: cursor.limit,
      offset: cursor.offset,
      total: usersCount
    };

    return {
      users,
      pageInfo
    };
  } else {
    return usersQuery;
  }
}

export async function getUsersById(userIds) {
  let usersQuery = r
    .reader("user")
    .select("id", "first_name", "last_name")
    .whereIn("id", userIds);
  return usersQuery;
}

export const resolvers = {
  UsersReturn: {
    __resolveType(obj) {
      if (Array.isArray(obj)) {
        return "UsersList";
      } else if ("users" in obj && "pageInfo" in obj) {
        return "PaginatedUsers";
      }
      return null;
    }
  },
  UsersList: {
    users: users => users
  },
  PaginatedUsers: {
    users: queryResult => queryResult.users,
    pageInfo: queryResult => {
      if ("pageInfo" in queryResult) {
        return queryResult.pageInfo;
      }
      return null;
    }
  },
  User: {
    ...sqlResolvers([
      "id",
      "firstName",
      "lastName",
      "email",
      "cell",
      "assignedCell",
      "terms"
    ]),
    displayName: user => `${user.first_name} ${user.last_name}`,
    currentRequest: async (user, { organizationId }) => {
      const currentRequest = await r
        .reader("assignment_request")
        .where({
          user_id: user.id,
          organization_id: organizationId,
          status: "pending"
        })
        .first("id", "amount", "status");

      return currentRequest || null;
    },
    assignment: async (user, { campaignId }) =>
      r
        .reader("assignment")
        .where({ user_id: user.id, campaign_id: campaignId })
        .first(),
    organizations: async (user, { role }) => {
      if (!user || !user.id) {
        return [];
      }
      return r.reader("organization").whereExists(function() {
        const whereClause = { user_id: user.id };
        if (role) {
          whereClause["role"] = role;
        }
        this.select(r.reader.raw("1"))
          .from("user_organization")
          .whereRaw("user_organization.organization_id = organization.id")
          .where(whereClause);
      });
    },
    roles: async (user, { organizationId }) =>
      r
        .reader("user_organization")
        .where({
          organization_id: parseInt(organizationId),
          user_id: user.id
        })
        .pluck("role"),
    teams: async (user, { organizationId }) =>
      r
        .reader("team")
        .select("team.*")
        .join("user_team", "user_team.team_id", "=", "team.id")
        .where({
          "user_team.user_id": user.id,
          "team.organization_id": organizationId
        }),
    todos: async (user, { organizationId }) =>
      r
        .reader("assignment")
        .select("assignment.*")
        .join("campaign", "campaign.id", "assignment.campaign_id")
        .where({
          "assignment.user_id": user.id,
          is_started: true,
          organization_id: parseInt(organizationId),
          is_archived: false
        })
  }
};
