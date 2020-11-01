import React from "react";
import { compose } from "recompose";
import gql from "graphql-tag";
import { ApolloQueryResult } from "apollo-client";
import cloneDeep from "lodash/cloneDeep";

import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";

import { loadData } from "../../containers/hoc/with-operations";
import { QueryMap, MutationMap } from "../../network/types";
import { RelayPaginatedResponse } from "../../api/pagination";
import { ExternalSystem } from "../../api/external-system";
import {
  ExternalSyncQuestionResponseConfig,
  FullListRefreshFragment
} from "../../api/external-sync-config";
import QuestionResponseConfig from "../QuestionResponseConfig";

import { GET_SYNC_CONFIGS, GET_SYNC_TARGETS } from "./queries";

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
  mutations: {
    createConfig(id: string): ApolloQueryResult<any>;
    deleteConfig(id: string): ApolloQueryResult<any>;
  };
}

interface OuterProps {
  organizationId: string;
  campaignId: string;
  onRequestClose(): void;
}

interface InnerProps extends OuterProps, HocProps {}

// interface State {
//   isMappingOpen: boolean;
// }

class SyncConfigurationModal extends React.Component<InnerProps> {
  render() {
    // const {} = this.state;
    const {
      campaignId,
      configs: { campaign },
      targets: {
        campaign: {
          externalSystem: { surveyQuestions, activistCodes, resultCodes }
        }
      }
    } = this.props;

    const responseMappings = campaign.externalSyncConfigurations.edges.map(
      (edge) => edge.node
    );
    // const validMappings = responseMappings.filter(mapping => !mapping.isMissing);
    // const requiredMappings = responseMappings.filter(mapping => mapping.isMissing && mapping.isRequired);
    // const optionalMappings = responseMappings.filter(mapping => mapping.isMissing && !mapping.isRequired);

    const actions = [
      <FlatButton
        label="Ok"
        primary={true}
        onClick={this.props.onRequestClose}
      />
    ];

    const makeOnCreateConfig = (id: string) => async () => {
      try {
        const response = await this.props.mutations.createConfig(id);
        if (response.errors) throw response.errors;
      } catch (err) {
        console.error(err);
      }
    };

    const makeOnDeleteConfig = (id: string) => async () => {
      try {
        const response = await this.props.mutations.deleteConfig(id);
        if (response.errors) throw response.errors;
      } catch (err) {
        console.error(err);
      }
    };

    return (
      <Dialog
        open={true}
        title="Configure Mapping"
        actions={actions}
        autoScrollBodyContent={true}
        onRequestClose={this.props.onRequestClose}
      >
        <p>
          For instructions on configuring mappings, please see the{" "}
          <a
            href="https://docs.spokerewired.com/article/93-van-list-loading"
            target="_blank"
          >
            VAN Integration
          </a>{" "}
          page.
        </p>
        {responseMappings.map((responseMapping) => (
          <QuestionResponseConfig
            key={responseMapping.id}
            campaignId={campaignId}
            config={responseMapping}
            surveyQuestions={surveyQuestions}
            activistCodes={activistCodes}
            resultCodes={resultCodes}
            style={{ marginTop: "10px" }}
            createConfig={makeOnCreateConfig(responseMapping.id)}
            deleteConfig={makeOnDeleteConfig(responseMapping.id)}
          />
        ))}
      </Dialog>
    );
  }
}

const queries: QueryMap<OuterProps> = {
  configs: {
    query: GET_SYNC_CONFIGS,
    options: (ownProps) => ({
      variables: {
        campaignId: ownProps.campaignId
      }
    })
  },
  targets: {
    query: GET_SYNC_TARGETS,
    options: (ownProps) => ({
      variables: {
        campaignId: ownProps.campaignId
      }
    })
  }
};

const mutations: MutationMap<OuterProps> = {
  createConfig: (ownProps) => (id: string) => ({
    mutation: gql`
      mutation createQuestionResponseSyncConfig(
        $input: QuestionResponseSyncConfigInput!
      ) {
        createQuestionResponseSyncConfig(input: $input) {
          ...FullListRefresh
        }
      }
      ${FullListRefreshFragment}
    `,
    variables: {
      input: {
        id
      }
    },
    refetchQueries: ["getCampaignSyncReadiness"],
    update: (
      store,
      { data: { createQuestionResponseSyncConfig: newConfig } }
    ) => {
      const variables = { campaignId: ownProps.campaignId };
      const data: any = cloneDeep(
        store.readQuery({
          query: GET_SYNC_CONFIGS,
          variables
        })
      );

      const { edges } = data.campaign.externalSyncConfigurations;
      const index = edges.findIndex(({ node }) => node.id === id);
      edges[index].node = { ...newConfig };

      store.writeQuery({
        query: GET_SYNC_CONFIGS,
        variables,
        data
      });
    }
  }),
  deleteConfig: (ownProps) => (id: string) => ({
    mutation: gql`
      mutation deleteQuestionResponseSyncConfig(
        $input: QuestionResponseSyncConfigInput!
      ) {
        deleteQuestionResponseSyncConfig(input: $input) {
          ...FullListRefresh
        }
      }
      ${FullListRefreshFragment}
    `,
    variables: {
      input: {
        id
      }
    },
    refetchQueries: ["getCampaignSyncReadiness"],
    update: (
      store,
      { data: { deleteQuestionResponseSyncConfig: missingConfig } }
    ) => {
      const variables = { campaignId: ownProps.campaignId };
      const data: any = cloneDeep(
        store.readQuery({
          query: GET_SYNC_CONFIGS,
          variables
        })
      );

      const { edges } = data.campaign.externalSyncConfigurations;
      const index = edges.findIndex(({ node }) => node.id === id);
      edges[index].node = { ...missingConfig };

      store.writeQuery({
        query: GET_SYNC_CONFIGS,
        variables,
        data
      });
    }
  })
};

export default compose<InnerProps, OuterProps>(
  loadData({ queries, mutations })
)(SyncConfigurationModal);
