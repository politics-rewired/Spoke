import { Assignment } from "../../../../api/assignment";
import { User } from "../../../../api/user";

export type TexterAssignment = Pick<
  Assignment,
  "contactsCount" | "maxContacts"
> & {
  messagedCount: number;
  needsMessageCount: number;
};

export type Texter = Pick<User, "id" | "firstName"> & {
  assignment: TexterAssignment;
};
