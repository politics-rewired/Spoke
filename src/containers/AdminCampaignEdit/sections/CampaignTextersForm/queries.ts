import { gql } from "@apollo/client";

export const GET_CAMPAIGN_TEXTERS = gql`
  query GetCampaignTexters($campaignId: String!, $organizationId: String!) {
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
        roles(organizationId: $organizationId)
      }
      contactsCount
      isStarted
      isApproved
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
        roles(organizationId: $organizationId)
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
