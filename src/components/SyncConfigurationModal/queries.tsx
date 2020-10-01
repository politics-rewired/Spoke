import gql from "graphql-tag";

import { FullListRefreshFragment } from "../../api/external-sync-config";

export const GET_SYNC_CONFIGS = gql`
  query getCampaignSyncConfigs($campaignId: String!) {
    campaign(id: $campaignId) {
      id
      externalSyncConfigurations {
        edges {
          node {
            ...FullListRefresh
          }
        }
      }
    }
  }
  ${FullListRefreshFragment}
`;

export const GET_SYNC_TARGETS = gql`
  query getSyncTargets($campaignId: String!) {
    campaign(id: $campaignId) {
      id
      externalSystem {
        id
        surveyQuestions {
          edges {
            node {
              id
              systemId
              externalId
              type
              cycle
              name
              mediumName
              shortName
              scriptQuestion
              status
              responseOptions {
                edges {
                  node {
                    id
                    externalSurveyQuestionId
                    externalId
                    name
                    mediumName
                    shortName
                  }
                }
              }
            }
          }
        }
        activistCodes {
          edges {
            node {
              id
              systemId
              externalId
              type
              name
              mediumName
              shortName
              description
              scriptQuestion
              status
            }
          }
        }
        resultCodes {
          edges {
            node {
              id
              systemId
              externalId
              name
              mediumName
              shortName
            }
          }
        }
      }
    }
  }
`;
