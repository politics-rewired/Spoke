import gql from "graphql-tag";

export const GET_CAMPAIGN_TEXTERS = gql`
  query GetCampaignTexters($campaignId: String!) {
    campaign(id: $campaignId) {
      id
      texters {
        id
        firstName
        lastName
        displayName
        assignment(campaignId: $campaignId) {
          contactsCount
          needsMessageCount: contactsCount(
            contactsFilter: { messageStatus: "needsMessage" }
          )
          maxContacts
        }
      }
      contactsCount
      isStarted
      dueBy
      readiness {
        id
        basics
      }
    }
  }
`;

export const GET_ORGANIZATION_TEXTERS = gql`
  query GetOrganizationTexters($organizationId: String!) {
    organization(id: $organizationId) {
      id
      texters: people {
        id
        firstName
        lastName
        displayName
      }
    }
  }
`;

export const EDIT_CAMPAIGN_TEXTERS = gql`
  mutation EditCampaignTexters($campaignId: String!, $payload: CampaignInput!) {
    editCampaign(id: $campaignId, campaign: $payload) {
      id
      texters {
        id
        firstName
        lastName
        assignment(campaignId: $campaignId) {
          contactsCount
          needsMessageCount: contactsCount(
            contactsFilter: { messageStatus: "needsMessage" }
          )
          maxContacts
        }
      }
    }
  }
`;
