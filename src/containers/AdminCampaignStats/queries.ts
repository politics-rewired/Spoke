import { gql } from "@apollo/client";

export const GET_CAMPAIGN = gql`
  query getCampaign($campaignId: String!) {
    campaign(id: $campaignId) {
      id
      title
      dueBy
      isArchived
      useDynamicAssignment
      pendingJobs {
        id
        jobType
        assigned
        status
      }
    }
  }
`;

export const GET_ORGANIZATION_DATA = gql`
  query getOrganizationData($organizationId: String!) {
    organization(id: $organizationId) {
      id
      name
      uuid
      teams {
        id
        title
      }
      texters: people {
        id
        firstName
        lastName
        displayName
      }
      numbersApiKey
      campaigns(cursor: { offset: 0, limit: 5000 }) {
        campaigns {
          id
          title
          createdAt
        }
      }
    }
  }
`;

export const GET_ORGANIZATIONS = gql`
  query getOrganizations {
    organizations {
      id
    }
  }
`;
