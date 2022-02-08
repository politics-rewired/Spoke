import { Tag } from "../../api/tag";
import { Team, TeamInput } from "../../api/team";

export type TagWithTitle = Pick<Tag, "id" | "title">;

export type TeamForAssignment = Pick<
  Team,
  | "id"
  | "title"
  | "textColor"
  | "backgroundColor"
  | "isAssignmentEnabled"
  | "assignmentType"
  | "maxRequestCount"
> & {
  escalationTags: TagWithTitle[];
};

export type TeamInputWithTags = TeamInput & { escalationTags?: TagWithTitle[] };
