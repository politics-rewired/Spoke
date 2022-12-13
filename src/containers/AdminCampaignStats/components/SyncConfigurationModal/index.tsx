import type { ApolloQueryResult } from "@apollo/client";
import { gql } from "@apollo/client";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import type {
  ExternalSyncQuestionResponseConfig,
  ExternalSystem
} from "@spoke/spoke-codegen";
import {
  FullListRefreshFragmentDoc,
  GetCampaignSyncConfigsDocument,
  GetSyncTargetsDocument
} from "@spoke/spoke-codegen";
import cloneDeep from "lodash/cloneDeep";
import React from "react";
import { compose } from "recompose";

import type { MutationMap, QueryMap } from "../../../../network/types";
import { loadData } from "../../../hoc/with-operations";
import type { RelayPaginatedResponse } from "../../api/pagination";
import QuestionResponseConfig from "../QuestionResponseConfig";

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
    <Button key="ok" color="primary" onClick={props.onRequestClose}>
      Ok
    </Button>
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
    query: GetCampaignSyncConfigsDocument,
    options: (ownProps) => ({
      variables: {
        campaignId: ownProps.campaignId
      }
    })
  },
  targets: {
    query: GetSyncTargetsDocument,
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
      ${FullListRefreshFragmentDoc}
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
          query: GetSyncTargetsDocument,
          variables
        })
      );

      const {
        edges
      }: { edges: any[] } = data.campaign.externalSyncConfigurations;
      const index = edges.findIndex(({ node }) => node.id === id);
      edges[index].node = { ...newConfig };

      store.writeQuery({
        query: GetCampaignSyncConfigsDocument,
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
      ${FullListRefreshFragmentDoc}
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
          query: GetSyncTargetsDocument,
          variables
        })
      );

      const {
        edges
      }: { edges: any[] } = data.campaign.externalSyncConfigurations;
      const index = edges.findIndex(({ node }) => node.id === id);
      edges[index].node = { ...missingConfig };

      store.writeQuery({
        query: GetCampaignSyncConfigsDocument,
        variables,
        data
      });
    }
  })
};

export default compose<InnerProps, OuterProps>(
  loadData({ queries, mutations })
)(SyncConfigurationModal);
