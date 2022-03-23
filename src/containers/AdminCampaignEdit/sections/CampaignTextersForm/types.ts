import { Assignment } from "../../../../api/assignment";
import { User } from "../../../../api/user";

export type TexterAssignment = Pick<
  Assignment,
  "contactsCount" | "maxContacts"
> & {
  messagedCount: number;
  needsMessageCount: number;
};

export type OrgTexter = Pick<User, "id" | "firstName" | "displayName">;

export type Texter = OrgTexter & {
  assignment: TexterAssignment;
  roles: string[];
};
