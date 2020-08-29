import React from "react";
import { compose } from "recompose";
import gql from "graphql-tag";
import { ApolloQueryResult } from "apollo-client";

import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
import SelectField from "material-ui/SelectField";
import MenuItem from "material-ui/MenuItem";

import { RelayPaginatedResponse } from "../api/pagination";
import { ExternalSyncQuestionResponseConfig } from "../api/external-sync-config";
import { ExternalSurveyQuestion } from "../api/external-survey-question";
import { ExternalActivistCode } from "../api/external-activist-code";
import { ExternalResultCode } from "../api/external-result-code";
import { QuestionResponseSyncTargetInput } from "../api/types";
import { loadData } from "../containers/hoc/with-operations";

enum MappingType {
  ResponseOption,
  ActivistCode,
  ResultCode
}

interface HocProps {
  mutations: {
    createTarget(
      payload: Omit<QuestionResponseSyncTargetInput, "configId">
    ): ApolloQueryResult<any>;
  };
}

interface OuterProps {
  config?: ExternalSyncQuestionResponseConfig;
  surveyQuestions: RelayPaginatedResponse<ExternalSurveyQuestion>;
  activistCodes: RelayPaginatedResponse<ExternalActivistCode>;
  resultCodes: RelayPaginatedResponse<ExternalResultCode>;
  onRequestClose(): void;
}

interface InnerProps extends OuterProps, HocProps {}

interface State {
  type: MappingType | null;
  surveyQuestionId: string | null;
  responseOptionId: string | null;
  activistCodeId: string | null;
  resultCodeId: string | null;
  isWorking: boolean;
  errorMessage?: string;
}

class AddMapping extends React.Component<InnerProps, State> {
  state: State = {
    type: null,
    surveyQuestionId: null,
    responseOptionId: null,
    activistCodeId: null,
    resultCodeId: null,
    isWorking: false,
    errorMessage: undefined
  };

  handleOnChangeMappingType = (
    e: React.SyntheticEvent<{}>,
    index: number,
    type: MappingType
  ) =>
    this.setState({
      type,
      activistCodeId: null,
      resultCodeId: null,
      surveyQuestionId: null,
      responseOptionId: null
    });

  handleOnChangeSurveyQuestion = (
    e: React.SyntheticEvent<{}>,
    index: number,
    surveyQuestionId: string
  ) => this.setState({ surveyQuestionId, responseOptionId: null });

  handleOnChangeResponseOption = (
    e: React.SyntheticEvent<{}>,
    index: number,
    responseOptionId: string
  ) => this.setState({ responseOptionId });

  handleOnChangeActivistCode = (
    e: React.SyntheticEvent<{}>,
    index: number,
    activistCodeId: string
  ) => this.setState({ activistCodeId });

  handleOnChangeResultCode = (
    e: React.SyntheticEvent<{}>,
    index: number,
    resultCodeId: string
  ) => this.setState({ resultCodeId });

  handleOnAddMapping = async () => {
    const validTarget = this.getValidTarget();
    if (validTarget === undefined) return;

    this.setState({ isWorking: true, errorMessage: undefined });
    try {
      const response = await this.props.mutations.createTarget(validTarget);
      if (response.errors) throw response.errors;
      this.props.onRequestClose();
    } catch (err) {
      this.setState({ errorMessage: err.message });
    } finally {
      this.setState({ isWorking: false });
    }
  };

  getValidTarget = ():
    | Omit<QuestionResponseSyncTargetInput, "configId">
    | undefined => {
    const { type, responseOptionId, activistCodeId, resultCodeId } = this.state;

    if (!this.props.config || type === null) return undefined;

    const base = {
      responseOptionId: null,
      activistCodeId: null,
      resultCodeId: null
    };
    if (type === MappingType.ResponseOption && responseOptionId !== null) {
      return Object.assign({}, base, { responseOptionId });
    }
    if (type === MappingType.ActivistCode && activistCodeId !== null) {
      return Object.assign({}, base, { activistCodeId });
    }
    if (type === MappingType.ResultCode && resultCodeId !== null) {
      return Object.assign({}, base, { resultCodeId });
    }

    return undefined;
  };

  render() {
    const { config } = this.props;

    const activeQuestionMaybe = this.props.surveyQuestions.edges.find(
      ({ node }) => node.id === this.state.surveyQuestionId
    );
    const activeQuestion = activeQuestionMaybe && activeQuestionMaybe.node;

    const validTarget = this.getValidTarget();

    const actions = [
      <FlatButton label="Cancel" onClick={this.props.onRequestClose} />,
      <FlatButton
        label="Add"
        primary={true}
        disabled={validTarget === undefined}
        onClick={this.handleOnAddMapping}
      />
    ];

    return (
      <Dialog
        open={config !== undefined}
        title="Add Mapping"
        modal={true}
        actions={actions}
        autoScrollBodyContent={true}
        onRequestClose={this.props.onRequestClose}
      >
        {config !== undefined && (
          <div>
            <SelectField
              floatingLabelText="Mapping Type"
              value={this.state.type}
              onChange={this.handleOnChangeMappingType}
            >
              <MenuItem
                value={MappingType.ResponseOption}
                primaryText="Survey Response"
              />
              <MenuItem
                value={MappingType.ActivistCode}
                primaryText="Activist Code"
              />
              {config.interactionStep.id && (
                <MenuItem
                  value={MappingType.ResultCode}
                  primaryText="Result Code"
                />
              )}
            </SelectField>
            <br />
            {this.state.type === MappingType.ActivistCode && (
              <SelectField
                floatingLabelText="Activist Code"
                value={this.state.activistCodeId}
                onChange={this.handleOnChangeActivistCode}
              >
                {this.props.activistCodes.edges.map(({ node }) => (
                  <MenuItem
                    key={node.id}
                    value={node.id}
                    primaryText={node.name}
                  />
                ))}
              </SelectField>
            )}
            {this.state.type === MappingType.ResultCode && (
              <SelectField
                floatingLabelText="Result Code"
                value={this.state.resultCodeId}
                onChange={this.handleOnChangeResultCode}
              >
                {this.props.resultCodes.edges.map(({ node }) => (
                  <MenuItem
                    key={node.id}
                    value={node.id}
                    primaryText={node.name}
                  />
                ))}
              </SelectField>
            )}
            {this.state.type === MappingType.ResponseOption && (
              <div>
                <SelectField
                  floatingLabelText="Survey Question"
                  value={this.state.surveyQuestionId}
                  onChange={this.handleOnChangeSurveyQuestion}
                >
                  {this.props.surveyQuestions.edges.map(({ node }) => (
                    <MenuItem
                      key={node.id}
                      value={node.id}
                      primaryText={node.name}
                    />
                  ))}
                </SelectField>
                <br />
                {activeQuestion && (
                  <SelectField
                    floatingLabelText="Response Option"
                    value={this.state.responseOptionId}
                    onChange={this.handleOnChangeResponseOption}
                  >
                    {activeQuestion.responseOptions.edges.map(({ node }) => (
                      <MenuItem
                        key={node.id}
                        value={node.id}
                        primaryText={node.name}
                      />
                    ))}
                  </SelectField>
                )}
              </div>
            )}
          </div>
        )}
        {this.state.errorMessage !== undefined && (
          <p>{this.state.errorMessage}</p>
        )}
      </Dialog>
    );
  }
}

const queries = {};

const mutations = {
  createTarget: (ownProps: InnerProps) => (input: {
    [key: string]: string;
  }) => ({
    mutation: gql`
      mutation createQuestionResponseSyncTarget(
        $input: QuestionResponseSyncTargetInput!
      ) {
        createQuestionResponseSyncTarget(input: $input) {
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
        configId: (ownProps.config || {}).id,
        ...input
      }
    }
  })
};

export default compose<InnerProps, OuterProps>(
  loadData({ queries, mutations })
)(AddMapping);
