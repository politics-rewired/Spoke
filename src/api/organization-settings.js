export const schema = `
  input OrganizationSettingsInput {
    defaulTexterApprovalStatus: RequestAutoApprove
    optOutMessage: String
    numbersApiKey: String
    showContactLastName: Boolean
    showContactCell: Boolean
  }

  type OranizationSettings {
    id: ID!
    defaulTexterApprovalStatus: RequestAutoApprove!
    optOutMessage: String
    numbersApiKey: String
    showContactLastName: Boolean
    showContactCell: Boolean
  }
`;
