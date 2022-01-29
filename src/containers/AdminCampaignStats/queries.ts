import gql from "graphql-tag";

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
      previewUrl
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
