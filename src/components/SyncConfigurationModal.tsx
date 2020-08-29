import React from "react";
import { compose } from "recompose";
import gql from "graphql-tag";

import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";

import { loadData } from "../containers/hoc/with-operations";
import { RelayPaginatedResponse } from "../api/pagination";
import { ExternalSystem } from "../api/external-system";
import { ExternalSyncQuestionResponseConfig } from "../api/external-sync-config";
import QuestionResponseConfig from "./QuestionResponseConfig";

interface HocProps {
  configs: {
    campaign: {
      id: string;
      externalSyncConfigurations: RelayPaginatedResponse<
        ExternalSyncQuestionResponseConfig
      >;
    };
  };
  targets: {
    campaign: {
      externalSystem: Pick<
        ExternalSystem,
        "id" | "surveyQuestions" | "activistCodes" | "resultCodes"
      >;
    };
  };
  mutations: {};
}

interface OuterProps {
  organizationId: string;
  campaignId: string;
  onRequestClose(): void;
  onComplete(): void;
}

interface InnerProps extends OuterProps, HocProps {}

// interface State {
//   isMappingOpen: boolean;
// }

class SyncConfigurationModal extends React.Component<InnerProps> {
  render() {
    // const {} = this.state;
    const {
      configs: { campaign },
      targets: {
        campaign: {
          externalSystem: { surveyQuestions, activistCodes, resultCodes }
        }
      }
    } = this.props;

    const responseMappings = campaign.externalSyncConfigurations.edges.map(
      edge => edge.node
    );
    // const validMappings = responseMappings.filter(mapping => !mapping.isMissing);
    // const requiredMappings = responseMappings.filter(mapping => mapping.isMissing && mapping.isRequired);
    // const optionalMappings = responseMappings.filter(mapping => mapping.isMissing && !mapping.isRequired);

    const actions = [
      <FlatButton label="Cancel" onClick={this.props.onRequestClose} />,
      <FlatButton label="Ok" primary={true} />
    ];

    return (
      <Dialog
        open={true}
        title="Configure Mapping"
        actions={actions}
        autoScrollBodyContent={true}
        onRequestClose={this.props.onRequestClose}
      >
        <p>TODO: write preamble.</p>
        {responseMappings.map(responseMapping => (
          <QuestionResponseConfig
            key={responseMapping.id}
            config={responseMapping}
            surveyQuestions={surveyQuestions}
            activistCodes={activistCodes}
            resultCodes={resultCodes}
            style={{ marginTop: "10px" }}
          />
        ))}
      </Dialog>
    );
  }
}

const queries = {
  configs: {
    query: gql`
      query getCampaignSyncConfigs($campaignId: String!) {
        campaign(id: $campaignId) {
          id
          externalSyncConfigurations {
            edges {
              node {
                id
                campaignId
                interactionStepId
                questionResponseValue
                isMissing
                isRequired
                createdAt
                updatedAt
                interactionStep {
                  id
                  scriptOptions
                  questionText
                  answerOption
                }
                targets {
                  edges {
                    node {
                      ... on ExternalResultCode {
                        id
                        name
                      }
                      ... on ExternalActivistCode {
                        id
                        name
                        description
                        scriptQuestion
                        status
                      }
                      ... on ExternalSurveyQuestionResponseOption {
                        id
                        name
                        externalSurveyQuestionId
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `,
    options: (ownProps: OuterProps) => ({
      variables: {
        campaignId: ownProps.campaignId
      }
    })
  },
  targets: {
    query: gql`
      query getSyncTargets($campaignId: String!) {
        campaign(id: $campaignId) {
          id
          externalSystem {
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
                        systemId
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
    `,
    options: (ownProps: OuterProps) => ({
      variables: {
        campaignId: ownProps.campaignId
      }
    })
  }
};

const mutations = {};

export default compose<InnerProps, OuterProps>(
  loadData({ queries, mutations })
)(SyncConfigurationModal);
