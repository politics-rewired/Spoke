import React from "react";
import { compose } from "recompose";
import gql from "graphql-tag";
import { ApolloQueryResult } from "apollo-client";

import { Card, CardHeader, CardText } from "material-ui/Card";
import { List } from "material-ui/List";
import Avatar from "material-ui/Avatar";
import FlatButton from "material-ui/FlatButton";
import RaisedButton from "material-ui/RaisedButton";
import DoneIcon from "material-ui/svg-icons/action/done";
import DeleteIcon from "material-ui/svg-icons/action/delete";
import AddBoxIcon from "material-ui/svg-icons/content/add-box";
import WarningIcon from "material-ui/svg-icons/alert/warning";
import InfoIcon from "material-ui/svg-icons/action/info";
import NotificationPausedIcon from "material-ui/svg-icons/social/notifications-paused";
import {
  green200,
  orange200,
  grey400,
  red600,
  darkBlack
} from "material-ui/styles/colors";

import { RelayPaginatedResponse } from "../../api/pagination";
import { QuestionResponseSyncTargetInput } from "../../api/types";
import {
  ExternalSyncQuestionResponseConfig,
  FullListRefreshFragment,
  isActivistCode,
  isResponseOption,
  isResultCode
} from "../../api/external-sync-config";
import { ExternalSurveyQuestion } from "../../api/external-survey-question";
import { ExternalActivistCode } from "../../api/external-activist-code";
import { ExternalResultCode } from "../../api/external-result-code";
import { loadData } from "../../containers/hoc/with-operations";
import { ActivistCodeMapping } from "./components/ActivistCodeMapping";
import { ResponseOptionMapping } from "./components/ResponseOptionMapping";
import { ResultCodeMapping } from "./components/ResultCodeMapping";
import AddMapping from "../AddMapping";

interface HocProps {
  data: {};
  mutations: {
    createConfig(): ApolloQueryResult<any>;
    deleteConfig(): ApolloQueryResult<any>;
    deleteTarget(
      payload: Omit<QuestionResponseSyncTargetInput, "configId">
    ): ApolloQueryResult<any>;
  };
}

interface OuterProps {
  config: ExternalSyncQuestionResponseConfig;
  surveyQuestions: RelayPaginatedResponse<ExternalSurveyQuestion>;
  activistCodes: RelayPaginatedResponse<ExternalActivistCode>;
  resultCodes: RelayPaginatedResponse<ExternalResultCode>;
  style?: React.CSSProperties;
}

interface InnerProps extends OuterProps, HocProps {}

interface State {
  isAddMappingOpen: boolean;
}

class QuestionResponseConfig extends React.Component<InnerProps> {
  state: State = {
    isAddMappingOpen: false
  };

  handleOnClickCreateConfig = async () => {
    try {
      const response = await this.props.mutations.createConfig();
      if (response.errors) throw response.errors;
    } catch (err) {
      console.error(err);
    }
  };
  handleOnClickDeleteConfig = async () => {
    try {
      const response = await this.props.mutations.deleteConfig();
      if (response.errors) throw response.errors;
    } catch (err) {
      console.error(err);
    }
  };

  makeHandleOnClickDeleteTarget = (
    targetId: string,
    type: keyof Omit<QuestionResponseSyncTargetInput, "configId">
  ) => async () => {
    try {
      const response = await this.props.mutations.deleteTarget({
        [type]: targetId
      });
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
      id,
      campaignId,
      interactionStepId,
      questionResponseValue,
      isMissing,
      isRequired,
      interactionStep: { questionText }
    } = config;

    const targets = config.targets
      ? config.targets.edges.map(({ node }) => node)
      : null;

    const avatar = isRequired ? (
      <Avatar
        icon={<WarningIcon />}
        color={darkBlack}
        backgroundColor={orange200}
      />
    ) : isMissing ? (
      <Avatar icon={<InfoIcon />} color={darkBlack} backgroundColor={grey400} />
    ) : targets && targets.length === 0 ? (
      <Avatar
        icon={<NotificationPausedIcon />}
        color={darkBlack}
        backgroundColor={green200}
      />
    ) : (
      <Avatar
        icon={<DoneIcon />}
        color={darkBlack}
        backgroundColor={green200}
      />
    );

    return (
      <Card
        expanded={false}
        onExpandChange={
          isMissing
            ? this.handleOnClickCreateConfig
            : this.handleOnClickDeleteConfig
        }
        style={style}
      >
        <CardHeader
          title={questionResponseValue}
          subtitle={questionText}
          avatar={avatar}
          showExpandableButton={true}
          closeIcon={isMissing ? <AddBoxIcon /> : <DeleteIcon color={red600} />}
        />
        {!isMissing &&
          targets !== null && (
            <CardText>
              {targets.length > 0 && (
                <List>
                  {targets.map(target => {
                    if (isResponseOption(target)) {
                      return (
                        <ResponseOptionMapping
                          key={target.id}
                          responseOption={target}
                          surveyQuestions={surveyQuestions}
                          onClickDelete={this.makeHandleOnClickDeleteTarget(
                            target.id,
                            "responseOptionId"
                          )}
                        />
                      );
                    } else if (isActivistCode(target)) {
                      return (
                        <ActivistCodeMapping
                          key={target.id}
                          activistCode={target}
                          onClickDelete={this.makeHandleOnClickDeleteTarget(
                            target.id,
                            "activistCodeId"
                          )}
                        />
                      );
                    } else if (isResultCode(target)) {
                      return (
                        <ResultCodeMapping
                          key={target.id}
                          resultCode={target}
                          onClickDelete={this.makeHandleOnClickDeleteTarget(
                            target.id,
                            "resultCodeId"
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
                  This is an explicitly empty mapping that will be skipped
                  during sync.
                </p>
              )}
              <RaisedButton
                label="Add Mapping"
                primary={true}
                disabled={targets.length === 3}
                onClick={this.handleOnClickAddMapping}
              />
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

const queries = {};

const mutations = {
  createConfig: (ownProps: InnerProps) => () => ({
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
        id: ownProps.config.id
      }
    }
  }),
  deleteConfig: (ownProps: InnerProps) => () => ({
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
        id: ownProps.config.id
      }
    }
  }),
  deleteTarget: (ownProps: InnerProps) => (
    input: Omit<QuestionResponseSyncTargetInput, "configId">
  ) => ({
    mutation: gql`
      mutation deleteQuestionResponseSyncTarget(
        $input: QuestionResponseSyncTargetInput!
      ) {
        deleteQuestionResponseSyncTarget(input: $input) {
          ...FullListRefresh
        }
      }
      ${FullListRefreshFragment}
    `,
    variables: {
      input: {
        configId: ownProps.config.id,
        ...input
      }
    }
  })
};

export default compose<InnerProps, OuterProps>(
  loadData({ queries, mutations })
)(QuestionResponseConfig);
