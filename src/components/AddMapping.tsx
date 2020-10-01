import React from "react";
import { compose } from "recompose";
import gql from "graphql-tag";
import { ApolloQueryResult } from "apollo-client";
import cloneDeep from "lodash/cloneDeep";

import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
import SelectField from "material-ui/SelectField";
import MenuItem from "material-ui/MenuItem";

import { RelayPaginatedResponse } from "../api/pagination";
import {
  ExternalSyncQuestionResponseConfig,
  ExternalSyncConfigTarget,
  isActivistCode,
  isResponseOption,
  isResultCode
} from "../api/external-sync-config";
import { ExternalSurveyQuestion } from "../api/external-survey-question";
import { ExternalActivistCode } from "../api/external-activist-code";
import { ExternalResultCode } from "../api/external-result-code";
import { ExternalDataCollectionStatus } from "../api/types";
import { QuestionResponseSyncTargetInput } from "../api/types";
import { GET_SYNC_CONFIGS } from "./SyncConfigurationModal/queries";
import { loadData } from "../containers/hoc/with-operations";
import { MutationMap } from "../network/types";

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
  existingTargets: ExternalSyncConfigTarget[];
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
      this.setState({
        type: null,
        activistCodeId: null,
        resultCodeId: null,
        surveyQuestionId: null,
        responseOptionId: null
      });
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
    const { config, existingTargets } = this.props;

    const activeActivistCodes = this.props.activistCodes.edges.filter(
      ({ node }) => node.status === ExternalDataCollectionStatus.ACTIVE
    );
    const activeSurveyQuestions = this.props.surveyQuestions.edges.filter(
      ({ node }) => node.status === ExternalDataCollectionStatus.ACTIVE
    );

    const activeQuestionMaybe = this.props.surveyQuestions.edges.find(
      ({ node }) => node.id === this.state.surveyQuestionId
    );
    const activeQuestion = activeQuestionMaybe && activeQuestionMaybe.node;

    const validTarget = this.getValidTarget();

    // This is a client-side-only check
    const responseOptionExists =
      existingTargets.find(target => isResponseOption(target)) !== undefined;
    const activistCodeExists =
      existingTargets.find(target => isActivistCode(target)) !== undefined;
    const resultCodeExists =
      existingTargets.find(target => isResultCode(target)) !== undefined;
    const isRootAnswer =
      config && config.interactionStep.parentInteractionId === null;
    const canMakeChanges =
      !responseOptionExists ||
      !activistCodeExists ||
      !(resultCodeExists || !isRootAnswer);

    const actions = [
      <FlatButton label="Cancel" onClick={this.props.onRequestClose} />,
      <FlatButton
        label="Add"
        primary={true}
        disabled={validTarget === undefined || !canMakeChanges}
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
              value={canMakeChanges ? this.state.type : null}
              autoWidth={true}
              onChange={this.handleOnChangeMappingType}
            >
              <MenuItem
                value={MappingType.ResponseOption}
                primaryText={`Survey Response${
                  responseOptionExists ? " (already configured)" : activeSurveyQuestions.length === 0 ? " (none active)" : ""
                }`}
                disabled={responseOptionExists || activeSurveyQuestions.length === 0}
              />
              <MenuItem
                value={MappingType.ActivistCode}
                primaryText={`Activist Code${
                  activistCodeExists ? " (already configured)" : activeActivistCodes.length === 0 ? " (none active)" : ""
                }`}
                disabled={activistCodeExists || activeActivistCodes.length === 0}
              />
              <MenuItem
                value={MappingType.ResultCode}
                primaryText={`Result Code${
                  resultCodeExists
                    ? " (already configured)"
                    : !isRootAnswer
                      ? " (not top-level question)"
                      : ""
                }`}
                disabled={resultCodeExists || !isRootAnswer}
              />
            </SelectField>
            <br />
            {this.state.type === MappingType.ActivistCode && (
              <SelectField
                floatingLabelText="Activist Code"
                value={this.state.activistCodeId}
                autoWidth={true}
                onChange={this.handleOnChangeActivistCode}
              >
                {activeActivistCodes.map(({ node }) => (
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
                autoWidth={true}
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
                  autoWidth={true}
                  onChange={this.handleOnChangeSurveyQuestion}
                >
                  {activeSurveyQuestions.map(({ node }) => (
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
                    autoWidth={true}
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

const mutations: MutationMap<InnerProps> = {
  createTarget: ownProps => (input: { [key: string]: string }) => ({
    mutation: gql`
      mutation createQuestionResponseSyncTarget(
        $input: QuestionResponseSyncTargetInput!
      ) {
        createQuestionResponseSyncTarget(input: $input) {
          ... on ExternalResultCodeTarget {
            id
            resultCode {
              id
              name
            }
          }
          ... on ExternalActivistCodeTarget {
            id
            activistCode {
              id
              name
              description
              scriptQuestion
              status
            }
          }
          ... on ExternalSurveyQuestionResponseOptionTarget {
            id
            responseOption {
              id
              name
              externalSurveyQuestionId
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
    },
    update: (store, { data: { createQuestionResponseSyncTarget: newTarget} }) => {
      const variables = { campaignId: ownProps.config?.campaignId };
      const data: any = cloneDeep(
        store.readQuery({
          query: GET_SYNC_CONFIGS,
          variables
        })
      );

      const configId = ownProps.config?.id;
      const { edges } = data.campaign.externalSyncConfigurations;
      const index = edges.findIndex(({ node }) => node.id === configId);
      edges[index].node.targets.push(newTarget);

      store.writeQuery({
        query: GET_SYNC_CONFIGS,
        variables,
        data
      });
    }
  })
};

export default compose<InnerProps, OuterProps>(
  loadData({ mutations })
)(AddMapping);
