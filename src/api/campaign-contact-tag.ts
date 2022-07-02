import { Tag } from "./tag";
import { User } from "./user";

export interface CampaignContactTag {
  id: string;
  tag: Tag;
  applier: User;
}

export const schema = `
  type CampaignContactTag {
    id: ID
    tag: Tag
    applier: User
  }
`;

export default schema;
