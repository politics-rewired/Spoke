import React, { Component } from 'react'
import gql from 'graphql-tag'
import { connect } from 'react-apollo'
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'

import LoadingIndicator from '../../LoadingIndicator'

class SurveyColumn extends Component {
  state = {
    questionResponses: {}
  }

  componentDidMount() {
    const { interactionSteps } = this.props.campaign
    const questionResponses = interactionSteps.filter(iStep => iStep.questionResponse)
      .reduce((collector, iStep) => {
        collector[iStep.id] = iStep.questionResponse.value
        return collector
      }, {})
    this.setState({ questionResponses })
  }

  getResponsesFrom = (startingStepId) => {
    const { interactionSteps } = this.props.campaign
    const { questionResponses } = this.state

    const iSteps = []
    let currentStep = interactionSteps.find(iStep => iStep.id === startingStepId)
    while (currentStep) {
      const children = interactionSteps.filter(iStep => iStep.parentInteractionId === currentStep.id)
      iSteps.push(Object.assign({}, currentStep, { children }))
      const value = questionResponses[currentStep.id]
      currentStep = value
        // Only show actionable questions
        ? interactionSteps.find(iStep => iStep.questionText && iStep.answerOption === value)
        : null
    }
    return iSteps
  }

  createHandler = (iStepId) => {
    return async (event, index, value) => {
      let { questionResponses } = this.state
      questionResponses[iStepId] = value
      console.log(questionResponses)
      this.setState({ questionResponses })
    }
  }

  render() {
    const { interactionSteps } = this.props.campaign
    const { questionResponses } = this.state

    if (interactionSteps.length === 0) {
      return <p>No survey question responses for this conversation.</p>
    }

    let startingStep = interactionSteps.find(iStep => iStep.parentInteractionId === null)
    const iSteps = this.getResponsesFrom(startingStep.id)

    return (
      <div style={{maxHeight: '400px', overflowY: 'scroll'}}>
        {iSteps.map((iStep, index, stepArray) => {
          const responseValue = questionResponses[iStep.id]
          // Disable if this is not the last _answered_ question
          const nextStep = stepArray[index + 1]
          const disabled = nextStep && questionResponses[nextStep.id]
          return (
            <SelectField
              key={iStep.id}
              floatingLabelText={iStep.questionText}
              value={responseValue}
              disabled={disabled}
              onChange={this.createHandler(iStep.id)}
              style={{ width: '100%' }}
            >
              <MenuItem value={null} primaryText="" />
              {iStep.children.map(option => (
                <MenuItem key={option.answerOption} value={option.answerOption} primaryText={option.answerOption} />
              ))}
            </SelectField>
          )
        })}
      </div>
    )
  }
}

const SurveyColumnWrapper = (props) => {
  const { surveyQuestions } = props
  return (
    <div>
      <h4>Survey Responses</h4>
      {surveyQuestions.loading && <LoadingIndicator />}
      {surveyQuestions.errors && <p>{surveyQuestions.errors.message}</p>}
      {surveyQuestions.campaign && (
        <SurveyColumn campaign={surveyQuestions.campaign} />
      )}
    </div>
  )
}

const mapQueriesToProps = ({ ownProps }) => ({
  surveyQuestions: {
    query: gql`query getSurveyQuestions($campaignId: String!, $contactId: String!) {
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
    }`,
    variables: {
      campaignId: ownProps.campaign.id,
      contactId: ownProps.contact.id
    },
    forceFetch: true
  }
})

const mapMutationsToProps = () => ({
  updateQuestionResponses: (questionResponses, campaignContactId) => ({
    mutation: gql`
      mutation updateQuestionResponses($questionResponses:[QuestionResponseInput], $campaignContactId: String!) {
        updateQuestionResponses(questionResponses: $questionResponses, campaignContactId: $campaignContactId) {
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
      mutation deleteQuestionResponses($interactionStepIds:[String], $campaignContactId: String!) {
        deleteQuestionResponses(interactionStepIds: $interactionStepIds, campaignContactId: $campaignContactId) {
          id
        }
      }
    `,
    variables: {
      interactionStepIds,
      campaignContactId
    }
  })
})

export default connect({
  mapQueriesToProps,
  mapMutationsToProps
})(SurveyColumnWrapper)
