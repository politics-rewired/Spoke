import { r } from "../models";
import { accessRequired } from "./errors";

export const resolvers = {
  Team: {
    id: async (team) => team.id,
    title: async (team) => team.title,
    description: async (team) => team.description,
    textColor: async (team) => team.text_color,
    backgroundColor: async (team) => team.background_color,
    author: async (team) =>
      r.reader("user").where({ id: team.author_id }).first("*"),
    isAssignmentEnabled: async (team) => team.is_assignment_enabled,
    assignmentPriority: async (team) => team.assignment_priority,
    assignmentType: async (team) => team.assignment_type,
    maxRequestCount: async (team) => team.max_request_count,
    createdAt: async (team) => team.created_at,

    users: async (team, _, { user }) => {
      await accessRequired(user, team.organization_id, "SUPERVOLUNTEER");

      return r
        .reader("user")
        .select("user.*")
        .join("user_team", "user_team.user_id", "=", "user.id")
        .where({
          "user_team.team_id": team.id
        });
    },
    campaigns: async (team, _, { user }) => {
      await accessRequired(user, team.organization_id, "SUPERVOLUNTEER");

      return r
        .reader("campaign")
        .select("campaign.*")
        .join("campaign_team", "campaign_team.campaign_id", "=", "campaign.id")
        .where({
          "campaign_team.team_id": team.id
        });
    },
    escalationTags: async (team, _, { user: _user }) => {
      return r
        .reader("team_escalation_tags")
        .join("tag", "tag.id", "=", "team_escalation_tags.tag_id")
        .where({ team_id: team.id });
    }
  }
};

export default resolvers;
