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
import {
  ExternalSyncQuestionResponseConfig,
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

  handleOnClickCreateConfig = () => this.props.mutations.createConfig();
  handleOnClickDeleteConfig = () => console.log("Delete the config");

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
      interactionStep: { questionText },
      targets
    } = config;

    const avatar = isRequired ? (
      <Avatar
        icon={<WarningIcon />}
        color={darkBlack}
        backgroundColor={orange200}
      />
    ) : isMissing ? (
      <Avatar icon={<InfoIcon />} color={darkBlack} backgroundColor={grey400} />
    ) : targets && targets.edges.length === 0 ? (
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
              {targets.edges.length > 0 && (
                <List>
                  {targets.edges.map(({ node }) => {
                    if (isResponseOption(node)) {
                      return (
                        <ResponseOptionMapping
                          key={node.id}
                          responseOption={node}
                          surveyQuestions={surveyQuestions}
                        />
                      );
                    } else if (isActivistCode(node)) {
                      return (
                        <ActivistCodeMapping
                          key={node.id}
                          activistCode={node}
                        />
                      );
                    } else if (isResultCode(node)) {
                      return (
                        <ResultCodeMapping key={node.id} resultCode={node} />
                      );
                    }

                    return null;
                  })}
                </List>
              )}
              {targets.edges.length === 0 && (
                <p>
                  This is an explicitly empty mapping that will be skipped
                  during sync.
                </p>
              )}
              <RaisedButton
                label="Add Mapping"
                primary={true}
                onClick={this.handleOnClickAddMapping}
              />
            </CardText>
          )}
        <AddMapping
          config={this.state.isAddMappingOpen ? config : undefined}
          surveyQuestions={surveyQuestions}
          activistCodes={activistCodes}
          resultCodes={resultCodes}
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
                }
                ... on ExternalSurveyQuestionResponseOption {
                  id
                  name
                }
              }
            }
          }
        }
      }
    `,
    variables: {
      input: {
        id: ownProps.config.id
      }
    }
  })
};

export default compose<InnerProps, OuterProps>(
  loadData({ queries, mutations })
)(QuestionResponseConfig);
