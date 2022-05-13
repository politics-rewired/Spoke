import { ApolloQueryResult, gql } from "@apollo/client";
import Button from "@material-ui/core/Button";
import { green, grey, orange, red } from "@material-ui/core/colors";
import AddBoxIcon from "@material-ui/icons/AddBox";
import BrokenImageIcon from "@material-ui/icons/BrokenImage";
import DeleteIcon from "@material-ui/icons/Delete";
import DoneIcon from "@material-ui/icons/Done";
import InfoIcon from "@material-ui/icons/Info";
import NotificationsPausedIcon from "@material-ui/icons/NotificationsPaused";
import WarningIcon from "@material-ui/icons/Warning";
import cloneDeep from "lodash/cloneDeep";
import Avatar from "material-ui/Avatar";
import { Card, CardHeader, CardText } from "material-ui/Card";
import { List } from "material-ui/List";
import React from "react";
import { compose } from "recompose";

import { ExternalActivistCode } from "../../api/external-activist-code";
import {
  ExternalResultCode,
  resultCodeWarning
} from "../../api/external-result-code";
import { ExternalSurveyQuestion } from "../../api/external-survey-question";
import {
  ExternalSyncQuestionResponseConfig,
  isActivistCode,
  isResponseOption,
  isResultCode
} from "../../api/external-sync-config";
import { RelayPaginatedResponse } from "../../api/pagination";
import { loadData } from "../../containers/hoc/with-operations";
import { MutationMap } from "../../network/types";
import AddMapping from "../AddMapping";
import { GET_SYNC_CONFIGS } from "../SyncConfigurationModal/queries";
import { ActivistCodeMapping } from "./components/ActivistCodeMapping";
import { ResponseOptionMapping } from "./components/ResponseOptionMapping";
import { ResultCodeMapping } from "./components/ResultCodeMapping";

interface HocProps {
  data: Record<string, unknown>;
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

interface State {
  isAddMappingOpen: boolean;
}

class QuestionResponseConfig extends React.Component<InnerProps> {
  state: State = {
    isAddMappingOpen: false
  };

  makeHandleOnClickDeleteTarget = (targetId: string) => async () => {
    try {
      const response = await this.props.mutations.deleteTarget(targetId);
      if (response.errors) throw response.errors;
    } catch (err) {
      console.error(err);
    }
  };

  handleOnClickAddMapping = () => this.setState({ isAddMappingOpen: true });

  handleOnDismissAddMapping = () => this.setState({ isAddMappingOpen: false });

  render() {
    const {
      config,
      surveyQuestions,
      activistCodes,
      resultCodes,
      style
    } = this.props;
    const {
      questionResponseValue,
      includesNotActive,
      isMissing,
      isRequired,
      interactionStep: { questionText }
    } = config;

    const { targets } = config;

    const avatar = includesNotActive ? (
      <Avatar
        icon={<BrokenImageIcon />}
        color={grey[900]}
        backgroundColor={orange[200]}
      />
    ) : isRequired ? (
      <Avatar
        icon={<WarningIcon />}
        color={grey[900]}
        backgroundColor={orange[200]}
      />
    ) : isMissing ? (
      <Avatar
        icon={<InfoIcon />}
        color={grey[900]}
        backgroundColor={grey[400]}
      />
    ) : targets && targets.length === 0 ? (
      <Avatar
        icon={<NotificationsPausedIcon />}
        color={grey[900]}
        backgroundColor={green[200]}
      />
    ) : (
      <Avatar
        icon={<DoneIcon />}
        color={grey[900]}
        backgroundColor={green[200]}
      />
    );

    return (
      <Card
        expanded={false}
        onExpandChange={
          isMissing ? this.props.createConfig : this.props.deleteConfig
        }
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
                        onClickDelete={this.makeHandleOnClickDeleteTarget(
                          target.id
                        )}
                      />
                    );
                  }
                  if (isActivistCode(target)) {
                    return (
                      <ActivistCodeMapping
                        key={target.id}
                        activistCode={target.activistCode}
                        onClickDelete={this.makeHandleOnClickDeleteTarget(
                          target.id
                        )}
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
                        onClickDelete={this.makeHandleOnClickDeleteTarget(
                          target.id
                        )}
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
              onClick={this.handleOnClickAddMapping}
            >
              Add Mapping
            </Button>
          </CardText>
        )}
        <AddMapping
          config={this.state.isAddMappingOpen ? config : undefined}
          surveyQuestions={surveyQuestions}
          activistCodes={activistCodes}
          resultCodes={resultCodes}
          existingTargets={targets || []}
          onRequestClose={this.handleOnDismissAddMapping}
        />
      </Card>
    );
  }
}

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
          query: GET_SYNC_CONFIGS,
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
        query: GET_SYNC_CONFIGS,
        variables,
        data
      });
    }
  })
};

export default compose<InnerProps, OuterProps>(loadData({ mutations }))(
  QuestionResponseConfig
);
