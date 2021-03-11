import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import { ApolloQueryResult } from "apollo-client";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";
import FlatButton from "material-ui/FlatButton";
import React from "react";
import { compose } from "recompose";

import {
  ExternalSyncQuestionResponseConfig,
  FullListRefreshFragment
} from "../../api/external-sync-config";
import { ExternalSystem } from "../../api/external-system";
import { RelayPaginatedResponse } from "../../api/pagination";
import { loadData } from "../../containers/hoc/with-operations";
import { MutationMap, QueryMap } from "../../network/types";
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

const SyncConfigurationModal: React.SFC<InnerProps> = (props) => {
  const {
    campaignId,
    configs: { campaign },
    targets: {
      campaign: {
        externalSystem: { surveyQuestions, activistCodes, resultCodes }
      }
    }
  } = props;

  const responseMappings = campaign.externalSyncConfigurations.edges.map(
    (edge) => edge.node
  );

  const actions = [
    <FlatButton key="ok" label="Ok" primary onClick={props.onRequestClose} />
  ];

  const makeOnCreateConfig = (id: string) => async () => {
    try {
      const response = await props.mutations.createConfig(id);
      if (response.errors) throw response.errors;
    } catch (err) {
      console.error(err);
    }
  };

  const makeOnDeleteConfig = (id: string) => async () => {
    try {
      const response = await props.mutations.deleteConfig(id);
      if (response.errors) throw response.errors;
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open scroll="body" onClose={props.onRequestClose}>
      <DialogTitle>Configure Mapping</DialogTitle>
      <DialogContent>
        <DialogContentText>
          For instructions on configuring mappings, please see the{" "}
          <a
            href="https://docs.spokerewired.com/article/93-van-list-loading"
            target="_blank"
            rel="noopener noreferrer"
          >
            VAN Integration
          </a>{" "}
          page.
        </DialogContentText>
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
      </DialogContent>
      <DialogActions>{actions}</DialogActions>
    </Dialog>
  );
};

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

      const {
        edges
      }: { edges: any[] } = data.campaign.externalSyncConfigurations;
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

      const {
        edges
      }: { edges: any[] } = data.campaign.externalSyncConfigurations;
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
