import React, { Component } from "react";
import gql from "graphql-tag";
import { connect } from "react-apollo";
import SelectField from "material-ui/SelectField";
import MenuItem from "material-ui/MenuItem";
import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";

import LoadingIndicator from "../../LoadingIndicator";

class SurveyColumn extends Component {
  state = {
    isMakingRequest: false,
    requestError: "",
    questionResponses: {}
  };

  componentWillMount() {
    const { interactionSteps } = this.props.campaign;
    const questionResponses = interactionSteps
      .filter(iStep => iStep.questionResponse)
      .reduce((collector, iStep) => {
        collector[iStep.id] = iStep.questionResponse.value;
        return collector;
      }, {});
    this.state.questionResponses = questionResponses;
  }

  getResponsesFrom = startingStepId => {
    const { interactionSteps } = this.props.campaign;
    const { questionResponses } = this.state;

    const iSteps = [];
    let currentStep = interactionSteps.find(
      iStep => iStep.questionText && iStep.id === startingStepId
    );
    while (currentStep) {
      const children = interactionSteps.filter(
        iStep => iStep.parentInteractionId === currentStep.id
      );
      iSteps.push(Object.assign({}, currentStep, { children }));
      const value = questionResponses[currentStep.id];
      currentStep = value
        ? // Only show actionable questions
          interactionSteps.find(
            iStep => iStep.questionText && iStep.answerOption === value
          )
        : null;
    }
    return iSteps;
  };

  createHandler = iStepId => {
    const {
      updateQuestionResponses,
      deleteQuestionResponses
    } = this.props.mutations;
    return async (event, index, value) => {
      this.setState({ isMakingRequest: true });
      const { contact } = this.props;
      let { questionResponses } = this.state;
      const affectedSteps = this.getResponsesFrom(iStepId);

      try {
        // Delete response for this and all children (unless this is a single question change)
        if (affectedSteps.length > 1 || !value) {
          const iStepIds = affectedSteps.map(iStep => iStep.id);
          const response = await deleteQuestionResponses(iStepIds, contact.id);
          if (response.errors) throw response.errors;
          iStepIds.forEach(iStepId => delete questionResponses[iStepId]);
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
        this.setState({ requestError: error.message });
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

    let startingStep = interactionSteps.find(
      iStep => iStep.parentInteractionId === null
    );
    const renderSteps = this.getResponsesFrom(startingStep.id);

    if (renderSteps.length === 0) {
      return <p>No answerable questions for this campaign.</p>;
    }

    const errorActions = [
      <FlatButton label="OK" primary={true} onClick={this.handleCloseError} />
    ];

    return (
      <div style={{ maxHeight: "400px", overflowY: "scroll" }}>
        {renderSteps.map(iStep => {
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
              {iStep.children.map(option => (
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

const SurveyColumnWrapper = props => {
  const { surveyQuestions, mutations, contact } = props;
  return (
    <div>
      <h4>Survey Responses</h4>
      {surveyQuestions.loading && <LoadingIndicator />}
      {surveyQuestions.errors && <p>{surveyQuestions.errors.message}</p>}
      {surveyQuestions.campaign && (
        <SurveyColumn
          campaign={surveyQuestions.campaign}
          contact={contact}
          mutations={mutations}
        />
      )}
    </div>
  );
};

const mapQueriesToProps = ({ ownProps }) => ({
  surveyQuestions: {
    query: gql`
      query getSurveyQuestions($campaignId: String!, $contactId: String!) {
        campaign(id: $campaignId) {
          id
          interactionSteps {
            id
            script
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
    variables: {
      campaignId: ownProps.campaign.id,
      contactId: ownProps.contact.id
    },
    forceFetch: true
  }
});

const mapMutationsToProps = () => ({
  updateQuestionResponses: (questionResponses, campaignContactId) => ({
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
  deleteQuestionResponses: (interactionStepIds, campaignContactId) => ({
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
});

export default connect({
  mapQueriesToProps,
  mapMutationsToProps
})(SurveyColumnWrapper);
