export interface Invite {
  id: string;
  isValid: boolean;
  hash: string;
}

export const schema = `
  type Invite {
    id: ID
    isValid: Boolean
    hash: String
  }
`;

export default schema;
