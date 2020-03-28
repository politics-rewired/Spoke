export const schema = `
  input OrganizationSettingsInput {
    defaulTexterApprovalStatus: RequestAutoApprove
    optOutMessage: String
    numbersApiKey: String
  }

  type OranizationSettings {
    id: ID!
    defaulTexterApprovalStatus: RequestAutoApprove!
    optOutMessage: String
    numbersApiKey: String
  }
`;
