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
    showDoNotAssignMessage: Boolean
    doNotAssignMessage: String
    defaultAutosendingControlsMode: AutosendingControlsMode

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
    showDoNotAssignMessage: Boolean!
    doNotAssignMessage: String!

    # Supervolunteer
    startCampaignRequiresApproval: Boolean
    scriptPreviewForSupervolunteers: Boolean
    defaultCampaignBuilderMode: CampaignBuilderMode

    # Admin
    defaultAutosendingControlsMode: AutosendingControlsMode

    # Owner
    defaulTexterApprovalStatus: RequestAutoApprove
    numbersApiKey: String
    trollbotWebhookUrl: String
  }
`;
export default schema;
