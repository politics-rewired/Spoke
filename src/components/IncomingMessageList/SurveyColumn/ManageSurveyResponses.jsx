import gql from "graphql-tag";
import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
import MenuItem from "material-ui/MenuItem";
import SelectField from "material-ui/SelectField";
import PropTypes from "prop-types";
import React, { Component } from "react";

import {
  formatErrorMessage,
  PrettyErrors,
  withOperations
} from "../../../containers/hoc/with-operations";
import LoadingIndicator from "../../LoadingIndicator";

class ManageSurveyResponses extends Component {
  state = {
    isMakingRequest: false,
    requestError: "",
    questionResponses: {}
  };

  componentWillMount() {
    const { interactionSteps } = this.props.campaign;
    const questionResponses = interactionSteps
      .filter((iStep) => iStep.questionResponse)
      .reduce((collector, iStep) => {
        collector[iStep.id] = iStep.questionResponse.value;
        return collector;
      }, {});
    // eslint-disable-next-line react/no-direct-mutation-state
    this.state.questionResponses = questionResponses;
  }

  getResponsesFrom = (startingStepId) => {
    const { interactionSteps } = this.props.campaign;
    const { questionResponses } = this.state;

    const iSteps = [];
    let currentStep = interactionSteps.find(
      (iStep) => iStep.questionText && iStep.id === startingStepId
    );
    while (currentStep) {
      const children = interactionSteps.filter(
        // eslint-disable-next-line no-loop-func
        (iStep) => iStep.parentInteractionId === currentStep.id
      );
      iSteps.push({ ...currentStep, children });
      const value = questionResponses[currentStep.id];
      currentStep = value
        ? // Only show actionable questions
          interactionSteps.find(
            (iStep) => iStep.questionText && iStep.answerOption === value
          )
        : null;
    }
    return iSteps;
  };

  createHandler = (iStepId) => {
    const {
      updateQuestionResponses,
      deleteQuestionResponses
    } = this.props.mutations;
    return async (event, index, value) => {
      this.setState({ isMakingRequest: true });
      const { contact } = this.props;
      const { questionResponses } = this.state;
      const affectedSteps = this.getResponsesFrom(iStepId);

      try {
        // Delete response for this and all children (unless this is a single question change)
        if (affectedSteps.length > 1 || !value) {
          const iStepIds = affectedSteps.map((iStep) => iStep.id);
          const response = await deleteQuestionResponses(iStepIds, contact.id);
          if (response.errors) throw response.errors;
          iStepIds.forEach((stepId) => delete questionResponses[stepId]);
        }

        if (value) {
          const input = {
            campaignContactId: contact.id,
            interactionStepId: iStepId,
            value
          };
          const response = await updateQuestionResponses([input], contact.id);
          if (response.errors) throw response.errors;
          questionResponses[iStepId] = value;
        }
      } catch (error) {
        this.setState({ requestError: formatErrorMessage(error) });
      } finally {
        this.setState({
          isMakingRequest: false,
          questionResponses
        });
      }
    };
  };

  handleCloseError = () => {
    this.setState({ requestError: "" });
  };

  render() {
    const { interactionSteps } = this.props.campaign;
    const { isMakingRequest, questionResponses } = this.state;

    const startingStep = interactionSteps.find(
      (iStep) => iStep.parentInteractionId === null
    );

    // There may not be an interaction step, or it may not define a question
    const renderSteps = startingStep
      ? this.getResponsesFrom(startingStep.id)
      : [];

    if (renderSteps.length === 0) {
      return <p>No answerable questions for this campaign.</p>;
    }

    const errorActions = [
      <FlatButton key="ok" label="OK" primary onClick={this.handleCloseError} />
    ];

    return (
      <div style={{ maxHeight: "400px", overflowY: "scroll" }}>
        {renderSteps.map((iStep) => {
          const responseValue = questionResponses[iStep.id];
          return (
            <SelectField
              key={iStep.id}
              floatingLabelText={iStep.questionText}
              value={responseValue}
              disabled={isMakingRequest}
              onChange={this.createHandler(iStep.id)}
              style={{ width: "100%" }}
            >
              <MenuItem value={null} primaryText="" />
              {iStep.children.map((option) => (
                <MenuItem
                  key={option.answerOption}
                  value={option.answerOption}
                  primaryText={option.answerOption}
                />
              ))}
            </SelectField>
          );
        })}
        <Dialog
          title="Error Updating Question Response"
          actions={errorActions}
          modal={false}
          open={!!this.state.requestError}
          onRequestClose={this.handleCloseError}
        >
          {this.state.requestError}
        </Dialog>
      </div>
    );
  }
}

ManageSurveyResponses.propTypes = {
  campaign: PropTypes.object.isRequired,
  contact: PropTypes.object.isRequired,
  mutations: PropTypes.object.isRequired
};

const ManageSurveyResponsesWrapper = (props) => {
  const { surveyQuestions, mutations, contact } = props;
  return (
    <div>
      <h4>Survey Responses</h4>
      {surveyQuestions.loading && <LoadingIndicator />}
      {surveyQuestions.errors && (
        <PrettyErrors errors={surveyQuestions.errors} />
      )}
      {surveyQuestions.campaign && (
        <ManageSurveyResponses
          campaign={surveyQuestions.campaign}
          contact={contact}
          mutations={mutations}
        />
      )}
    </div>
  );
};

ManageSurveyResponsesWrapper.propTypes = {
  contact: PropTypes.object.isRequired,
  mutations: PropTypes.object.isRequired,
  surveyQuestions: PropTypes.object.isRequired
};

const queries = {
  surveyQuestions: {
    query: gql`
      query getSurveyQuestions($campaignId: String!, $contactId: String!) {
        campaign(id: $campaignId) {
          id
          interactionSteps {
            id
            questionText
            answerOption
            parentInteractionId
            isDeleted
            answerActions

            questionResponse(campaignContactId: $contactId) {
              id
              value
            }
          }
        }
      }
    `,
    options: (ownProps) => ({
      variables: {
        campaignId: ownProps.campaign.id,
        contactId: ownProps.contact.id
      },
      fetchPolicy: "network-only"
    })
  }
};

const mutations = {
  updateQuestionResponses: () => (questionResponses, campaignContactId) => ({
    mutation: gql`
      mutation updateQuestionResponses(
        $questionResponses: [QuestionResponseInput]
        $campaignContactId: String!
      ) {
        updateQuestionResponses(
          questionResponses: $questionResponses
          campaignContactId: $campaignContactId
        ) {
          id
        }
      }
    `,
    variables: {
      questionResponses,
      campaignContactId
    }
  }),
  deleteQuestionResponses: () => (interactionStepIds, campaignContactId) => ({
    mutation: gql`
      mutation deleteQuestionResponses(
        $interactionStepIds: [String]
        $campaignContactId: String!
      ) {
        deleteQuestionResponses(
          interactionStepIds: $interactionStepIds
          campaignContactId: $campaignContactId
        ) {
          id
        }
      }
    `,
    variables: {
      interactionStepIds,
      campaignContactId
    }
  })
};

export default withOperations({
  queries,
  mutations
})(ManageSurveyResponsesWrapper);
