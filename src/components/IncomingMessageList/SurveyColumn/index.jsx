import React, { Component } from 'react'
import gql from 'graphql-tag'
import { connect } from 'react-apollo'
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'

import LoadingIndicator from '../../LoadingIndicator'

class SurveyColumn extends Component {
  state = {
    interactionSteps: []
  }

  componentDidMount() {
    const { interactionSteps } = this.props.campaign
    this.setState({ interactionSteps })
  }

  createHandler = (iStepId) => {
    return async (event, index, value) => {
      console.log(iStepId, value)
    }
  }

  render() {
    const { interactionSteps } = this.state

    if (interactionSteps.length === 0) {
      return <p>No survey question responses for this conversation.</p>
    }

    const iSteps = []
    let currentStep = interactionSteps.find(iStep => iStep.parentInteractionId === null)
    while (currentStep) {
      const children = interactionSteps.filter(iStep => iStep.parentInteractionId === currentStep.id)
      iSteps.push(Object.assign({}, currentStep, { children }))
      if (currentStep.questionResponse) {
        const value = currentStep.questionResponse.value
        currentStep = interactionSteps.find(iStep => iStep.answerOption === value)
      } else {
        currentStep = null
      }
    }

    return (
      <div style={{maxHeight: '400px', overflowY: 'scroll'}}>
        {iSteps.map(iStep => {
          const responseValue = iStep.questionResponse && iStep.questionResponse.value
          return (
            <SelectField
              key={iStep.id}
              floatingLabelText={iStep.questionText}
              value={responseValue}
              disabled={false}
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
      {!surveyQuestions.loading && (
        <SurveyColumn campaign={surveyQuestions.campaign} />
      )}
    </div>
  )
}

const mapSurveyColumnQueriesToProps = ({ ownProps }) => ({
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

export default connect({
  mapQueriesToProps: mapSurveyColumnQueriesToProps
})(SurveyColumnWrapper)
