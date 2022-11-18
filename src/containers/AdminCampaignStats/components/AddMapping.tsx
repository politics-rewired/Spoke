/* eslint-disable react/no-unused-state */
import type { ApolloQueryResult } from "@apollo/client";
import { gql } from "@apollo/client";
import Button from "@material-ui/core/Button";
import { blueGrey } from "@material-ui/core/colors";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import type {
  ExternalActivistCode,
  ExternalResultCode,
  ExternalSurveyQuestion,
  ExternalSyncConfigTarget,
  ExternalSyncQuestionResponseConfig,
  QuestionResponseSyncTargetInput
} from "@spoke/spoke-codegen";
import { GetCampaignSyncConfigsDocument } from "@spoke/spoke-codegen";
import cloneDeep from "lodash/cloneDeep";
import MenuItem from "material-ui/MenuItem";
import SelectField from "material-ui/SelectField";
import React from "react";
import { compose } from "recompose";

import { resultCodeWarning } from "../../../api/external-result-code";
import {
  isActivistCode,
  isResponseOption,
  isResultCode
} from "../../../api/external-sync-config";
import type { RelayPaginatedResponse } from "../../../api/pagination";
import { ExternalDataCollectionStatus } from "../../../api/types";
import type { MutationMap } from "../../../network/types";
import { loadData } from "../../hoc/with-operations";

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
    e: React.SyntheticEvent<unknown>,
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
    e: React.SyntheticEvent<unknown>,
    index: number,
    surveyQuestionId: string
  ) => this.setState({ surveyQuestionId, responseOptionId: null });

  handleOnChangeResponseOption = (
    e: React.SyntheticEvent<unknown>,
    index: number,
    responseOptionId: string
  ) => this.setState({ responseOptionId });

  handleOnChangeActivistCode = (
    e: React.SyntheticEvent<unknown>,
    index: number,
    activistCodeId: string
  ) => this.setState({ activistCodeId });

  handleOnChangeResultCode = (
    e: React.SyntheticEvent<unknown>,
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
      responseOptionId: undefined,
      activistCodeId: undefined,
      resultCodeId: undefined
    };
    if (type === MappingType.ResponseOption && responseOptionId !== null) {
      return { ...base, responseOptionId };
    }
    if (type === MappingType.ActivistCode && activistCodeId !== null) {
      return { ...base, activistCodeId };
    }
    if (type === MappingType.ResultCode && resultCodeId !== null) {
      return { ...base, resultCodeId };
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
      existingTargets.find((target) => isResponseOption(target)) !== undefined;
    const activistCodeExists =
      existingTargets.find((target) => isActivistCode(target)) !== undefined;
    const resultCodeExists =
      existingTargets.find((target) => isResultCode(target)) !== undefined;
    const isRootAnswer =
      config && config.interactionStep.parentInteractionId === null;
    const canMakeChanges =
      !responseOptionExists ||
      !activistCodeExists ||
      !(resultCodeExists || !isRootAnswer);

    const actions = [
      <Button key="cancel" onClick={this.props.onRequestClose}>
        Cancel
      </Button>,
      <Button
        key="add"
        color="primary"
        disabled={validTarget === undefined || !canMakeChanges}
        onClick={this.handleOnAddMapping}
      >
        Add
      </Button>
    ];

    return (
      <Dialog
        open={config !== undefined}
        scroll="paper"
        onClose={this.props.onRequestClose}
      >
        <DialogTitle>Add Mapping</DialogTitle>
        {config !== undefined && (
          <DialogContent>
            <table>
              <tr>
                <td style={{ color: blueGrey[800] }}>Question</td>
                <td>{config.interactionStep.questionText}</td>
              </tr>
              <tr>
                <td style={{ color: blueGrey[800] }}>Answer</td>
                <td>{config.questionResponseValue}</td>
              </tr>
            </table>
            <SelectField
              floatingLabelText="Mapping Type"
              value={canMakeChanges ? this.state.type : null}
              autoWidth
              onChange={this.handleOnChangeMappingType}
            >
              <MenuItem
                value={MappingType.ResponseOption}
                primaryText={`Survey Response${
                  responseOptionExists
                    ? " (already configured)"
                    : activeSurveyQuestions.length === 0
                    ? " (none active)"
                    : ""
                }`}
                disabled={
                  responseOptionExists || activeSurveyQuestions.length === 0
                }
              />
              <MenuItem
                value={MappingType.ActivistCode}
                primaryText={`Activist Code${
                  activistCodeExists
                    ? " (already configured)"
                    : activeActivistCodes.length === 0
                    ? " (none active)"
                    : ""
                }`}
                disabled={
                  activistCodeExists || activeActivistCodes.length === 0
                }
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
                autoWidth
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
                autoWidth
                onChange={this.handleOnChangeResultCode}
              >
                {this.props.resultCodes.edges.map(({ node }) => {
                  const warning = resultCodeWarning(node);
                  const name = warning
                    ? `${node.name} - ${warning}`
                    : node.name;
                  return (
                    <MenuItem
                      key={node.id}
                      value={node.id}
                      primaryText={name}
                      disabled={warning !== undefined}
                    />
                  );
                })}
              </SelectField>
            )}
            {this.state.type === MappingType.ResponseOption && (
              <div>
                <SelectField
                  floatingLabelText="Survey Question"
                  value={this.state.surveyQuestionId}
                  autoWidth
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
                    autoWidth
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
            {this.state.errorMessage !== undefined && (
              <DialogContentText>{this.state.errorMessage}</DialogContentText>
            )}
          </DialogContent>
        )}
        <DialogActions>{actions}</DialogActions>
      </Dialog>
    );
  }
}

const mutations: MutationMap<InnerProps> = {
  createTarget: (ownProps) => (input: { [key: string]: string }) => ({
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
    update: (
      store,
      { data: { createQuestionResponseSyncTarget: newTarget } }
    ) => {
      const variables = { campaignId: ownProps.config?.campaignId };
      const data: any = cloneDeep(
        store.readQuery({
          query: GetCampaignSyncConfigsDocument,
          variables
        })
      );

      const configId = ownProps.config?.id;
      const {
        edges
      }: { edges: any[] } = data.campaign.externalSyncConfigurations;
      const index = edges.findIndex(({ node }) => node.id === configId);
      edges[index].node.targets.push(newTarget);

      store.writeQuery({
        query: GetCampaignSyncConfigsDocument,
        variables,
        data
      });
    }
  })
};

export default compose<InnerProps, OuterProps>(loadData({ mutations }))(
  AddMapping
);
