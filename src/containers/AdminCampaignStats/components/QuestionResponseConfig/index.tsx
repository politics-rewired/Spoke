import type { ApolloQueryResult } from "@apollo/client";
import { gql } from "@apollo/client";
import { makeStyles } from "@material-ui/core";
import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import { green, grey, orange, red } from "@material-ui/core/colors";
import List from "@material-ui/core/List";
import AddBoxIcon from "@material-ui/icons/AddBox";
import BrokenImageIcon from "@material-ui/icons/BrokenImage";
import DeleteIcon from "@material-ui/icons/Delete";
import DoneIcon from "@material-ui/icons/Done";
import InfoIcon from "@material-ui/icons/Info";
import NotificationsPausedIcon from "@material-ui/icons/NotificationsPaused";
import WarningIcon from "@material-ui/icons/Warning";
import type {
  ExternalActivistCode,
  ExternalResultCode,
  ExternalSurveyQuestion,
  ExternalSyncQuestionResponseConfig
} from "@spoke/spoke-codegen";
import { GetCampaignSyncConfigsDocument } from "@spoke/spoke-codegen";
import cloneDeep from "lodash/cloneDeep";
import { Card, CardHeader, CardText } from "material-ui/Card";
import React, { useState } from "react";
import { compose } from "recompose";

import { resultCodeWarning } from "../../../../api/external-result-code";
import {
  isActivistCode,
  isResponseOption,
  isResultCode
} from "../../../../api/external-sync-config";
import type { MutationMap } from "../../../../network/types";
import { loadData } from "../../../hoc/with-operations";
import type { RelayPaginatedResponse } from "../../api/pagination";
import AddMapping from "../AddMapping";
import { ActivistCodeMapping } from "./components/ActivistCodeMapping";
import { ResponseOptionMapping } from "./components/ResponseOptionMapping";
import { ResultCodeMapping } from "./components/ResultCodeMapping";

const useStyles = makeStyles({
  inactive: {
    color: grey[900],
    backgroundColor: orange[200]
  },
  required: {
    color: grey[900],
    backgroundColor: orange[200]
  },
  missing: {
    color: grey[900],
    backgroundColor: grey[400]
  },
  noTargets: {
    color: grey[900],
    backgroundColor: green[200]
  },
  hasTargets: {
    color: grey[900],
    backgroundColor: green[200]
  }
});

interface HocProps {
  mutations: {
    deleteTarget(targetId: string): ApolloQueryResult<string>;
  };
}

interface OuterProps {
  campaignId: string;
  config: ExternalSyncQuestionResponseConfig;
  surveyQuestions: RelayPaginatedResponse<ExternalSurveyQuestion>;
  activistCodes: RelayPaginatedResponse<ExternalActivistCode>;
  resultCodes: RelayPaginatedResponse<ExternalResultCode>;
  style?: React.CSSProperties;
  createConfig(): void;
  deleteConfig(): void;
}

interface InnerProps extends OuterProps, HocProps {}

const QuestionResponseConfig: React.FC<InnerProps> = (props) => {
  const {
    mutations,
    config,
    surveyQuestions,
    activistCodes,
    resultCodes,
    style
  } = props;

  const [isAddMappingOpen, setIsAddMappingOpen] = useState(false);
  const styles = useStyles();

  const makeHandleOnClickDeleteTarget = (targetId: string) => async () => {
    try {
      const response = await mutations.deleteTarget(targetId);
      if (response.errors) throw response.errors;
    } catch (err) {
      console.error(err);
    }
  };

  const handleOnClickAddMapping = () => setIsAddMappingOpen(true);

  const handleOnDismissAddMapping = () => setIsAddMappingOpen(false);

  const {
    questionResponseValue,
    includesNotActive,
    isMissing,
    isRequired,
    interactionStep: { questionText }
  } = config;

  const { targets } = config;

  const avatar = includesNotActive ? (
    <Avatar className={styles.inactive}>
      <BrokenImageIcon />
    </Avatar>
  ) : isRequired ? (
    <Avatar className={styles.required}>
      <WarningIcon />
    </Avatar>
  ) : isMissing ? (
    <Avatar className={styles.missing}>
      <InfoIcon />
    </Avatar>
  ) : targets && targets.length === 0 ? (
    <Avatar className={styles.noTargets}>
      <NotificationsPausedIcon />
    </Avatar>
  ) : (
    <Avatar className={styles.hasTargets}>
      <DoneIcon />
    </Avatar>
  );

  return (
    <Card
      expanded={false}
      onExpandChange={isMissing ? props.createConfig : props.deleteConfig}
      style={style}
    >
      <CardHeader
        title={questionResponseValue}
        subtitle={questionText}
        avatar={avatar}
        showExpandableButton
        closeIcon={
          isMissing ? (
            <AddBoxIcon />
          ) : (
            <DeleteIcon style={{ color: red[600] }} />
          )
        }
      />
      {!isMissing && targets !== null && (
        <CardText>
          {targets.length > 0 && (
            <List>
              {targets.map((target) => {
                if (isResponseOption(target)) {
                  return (
                    <ResponseOptionMapping
                      key={target.id}
                      responseOption={target.responseOption}
                      surveyQuestions={surveyQuestions}
                      onClickDelete={makeHandleOnClickDeleteTarget(target.id)}
                    />
                  );
                }
                if (isActivistCode(target)) {
                  return (
                    <ActivistCodeMapping
                      key={target.id}
                      activistCode={target.activistCode}
                      onClickDelete={makeHandleOnClickDeleteTarget(target.id)}
                    />
                  );
                }
                if (isResultCode(target)) {
                  const warning = resultCodeWarning(target.resultCode);
                  return (
                    <ResultCodeMapping
                      key={target.id}
                      resultCode={target.resultCode}
                      warning={warning}
                      onClickDelete={makeHandleOnClickDeleteTarget(target.id)}
                    />
                  );
                }

                return null;
              })}
            </List>
          )}
          {targets.length === 0 && (
            <p>
              This is an explicitly empty mapping that will be skipped during
              sync.
            </p>
          )}
          <Button
            variant="contained"
            color="primary"
            disabled={targets.length === 3}
            onClick={handleOnClickAddMapping}
          >
            Add Mapping
          </Button>
        </CardText>
      )}
      <AddMapping
        config={isAddMappingOpen ? config : undefined}
        surveyQuestions={surveyQuestions}
        activistCodes={activistCodes}
        resultCodes={resultCodes}
        existingTargets={targets || []}
        onRequestClose={handleOnDismissAddMapping}
      />
    </Card>
  );
};

const mutations: MutationMap<InnerProps> = {
  deleteTarget: (ownProps) => (targetId: string) => ({
    mutation: gql`
      mutation deleteQuestionResponseSyncTarget($targetId: String!) {
        deleteQuestionResponseSyncTarget(targetId: $targetId)
      }
    `,
    variables: {
      targetId
    },
    update: (store) => {
      const variables = { campaignId: ownProps.campaignId };
      const data: any = cloneDeep(
        store.readQuery({
          query: GetCampaignSyncConfigsDocument,
          variables
        })
      );

      const configId = ownProps.config.id;
      const {
        edges
      }: { edges: any[] } = data.campaign.externalSyncConfigurations;
      const index = edges.findIndex(({ node }) => node.id === configId);
      edges[index].node.targets = edges[index].node.targets.filter(
        (target: { id: string }) => target.id !== targetId
      );

      store.writeQuery({
        query: GetCampaignSyncConfigsDocument,
        variables,
        data
      });
    }
  })
};

export default compose<InnerProps, OuterProps>(loadData({ mutations }))(
  QuestionResponseConfig
);
