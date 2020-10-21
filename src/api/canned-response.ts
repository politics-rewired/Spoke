export interface CannedResponse {
  id: string;
  title: string;
  text: string;
  isUserCreated: boolean;
}

export const schema = `
  input CannedResponseInput {
    id: String
    title: String
    text: String
    campaignId: String
    userId: String
  }

  type CannedResponse {
    id: ID
    title: String
    text: String
    isUserCreated: Boolean
  }
`;
