import gql from "graphql-tag";

import { RequestAutoApproveType } from "./organization-membership";

export interface OrganizationSettingsInput {
  defaulTexterApprovalStatus: RequestAutoApproveType | null;
  optOutMessage: string | null;
  numbersApiKey: string | null;
  trollbotWebhookUrl: string | null;
  showContactLastName: boolean | null;
  showContactCell: boolean | null;
  confirmationClickForScriptLinks: boolean | null;
}

export interface OrganizationSettings {
  id: string;
  defaulTexterApprovalStatus: RequestAutoApproveType;
  optOutMessage: string | null;
  numbersApiKey: string | null;
  trollbotWebhookUrl: string | null;
  showContactLastName: boolean | null;
  showContactCell: boolean | null;
  confirmationClickForScriptLinks: boolean;
}

export const schema = `
  input OrganizationSettingsInput {
    defaulTexterApprovalStatus: RequestAutoApprove
    optOutMessage: String
    numbersApiKey: String
    trollbotWebhookUrl: String
    showContactLastName: Boolean
    showContactCell: Boolean
    confirmationClickForScriptLinks: Boolean
  }

  type OrganizationSettings {
    id: ID!
    defaulTexterApprovalStatus: RequestAutoApprove!
    optOutMessage: String
    numbersApiKey: String
    trollbotWebhookUrl: String
    showContactLastName: Boolean
    showContactCell: Boolean
    confirmationClickForScriptLinks: Boolean!
  }
`;

export const AllOrganizationSettingsFragment = gql`
  fragment AllOrganizationSettingsFragment on OrganizationSettings {
    id
    defaulTexterApprovalStatus
    optOutMessage
    numbersApiKey
    trollbotWebhookUrl
    showContactLastName
    showContactCell
    confirmationClickForScriptLinks
  }
`;

export const TexterOrganizationSettingsFragment = gql`
  fragment TexterOrganizationSettingsFragment on OrganizationSettings {
    id
    showContactLastName
    showContactCell
    confirmationClickForScriptLinks
  }
`;
