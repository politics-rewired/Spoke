import type { RequestAutoApproveType } from "./organization-membership";

export interface OrganizationSettingsInput {
  // Owner
  optOutMessage: string | null;
  showContactLastName: boolean | null;
  showContactCell: boolean | null;
  confirmationClickForScriptLinks: boolean | null;
  defaulTexterApprovalStatus: RequestAutoApproveType | null;
  numbersApiKey: string | null;
  trollbotWebhookUrl: string | null;
  scriptPreviewForSupervolunteers: boolean | null;

  // Superadmin
  startCampaignRequiresApproval: boolean | null;
}

export interface OrganizationSettings {
  id: string;

  // Texter
  optOutMessage: string;
  showContactLastName: boolean;
  showContactCell: boolean;
  confirmationClickForScriptLinks: boolean;

  // Supervolunteer
  startCampaignRequiresApproval: boolean | null;
  scriptPreviewForSupervolunteers: boolean | null;

  // Owner
  defaulTexterApprovalStatus: RequestAutoApproveType | null;
  numbersApiKey: string | null;
  trollbotWebhookUrl: string | null;
}

export const schema = `
  input OrganizationSettingsInput {
    # Owner
    optOutMessage: String
    showContactLastName: Boolean
    showContactCell: Boolean
    confirmationClickForScriptLinks: Boolean
    defaulTexterApprovalStatus: RequestAutoApprove
    numbersApiKey: String
    trollbotWebhookUrl: String
    scriptPreviewForSupervolunteers: Boolean
    defaultCampaignBuilderMode: CampaignBuilderMode

    # Superadmin
    startCampaignRequiresApproval: Boolean
  }

  type OrganizationSettings {
    id: ID!

    # Texter
    optOutMessage: String!
    showContactLastName: Boolean!
    showContactCell: Boolean!
    confirmationClickForScriptLinks: Boolean!

    # Supervolunteer
    startCampaignRequiresApproval: Boolean
    scriptPreviewForSupervolunteers: Boolean
    defaultCampaignBuilderMode: CampaignBuilderMode

    # Owner
    defaulTexterApprovalStatus: RequestAutoApprove
    numbersApiKey: String
    trollbotWebhookUrl: String
  }
`;
