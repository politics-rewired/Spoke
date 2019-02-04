import React, { Component } from 'react'
import gql from 'graphql-tag'
import { connect } from 'react-apollo'
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'

class SurveyItemBody extends Component {
  constructor(props) {
    super(props)

    this.state = {
      value: props.questionResponse.value,
      disabled: false
    }
  }

  handleChange = async (event, index, value) => {
    const { contactId, questionResponse, mutations } = this.props
    const { interactionStepId } = questionResponse
    const { updateQuestionResponses, deleteQuestionResponses } = mutations

    this.setState({ disabled: true })
    let result = null

    if (value === null) {
      result = await deleteQuestionResponses([interactionStepId], contactId)
    } else {
      const input = {
        interactionStepId,
        campaignContactId: contactId,
        value
      }
      result = await updateQuestionResponses([input], contactId)
    }
    if (!result.errors) {
      this.setState({
        disabled: false,
        value
      })
    }
  }

  render() {
    const { question } = this.props.questionResponse
    return (
      <div>
        <SelectField
          floatingLabelText={question.text}
          value={this.state.value}
          disabled={this.state.disabled}
          onChange={this.handleChange}
          style={{ width: '100%' }}
        >
          <MenuItem value={null} primaryText="" />
          {question.answerOptions.map(option => (
            <MenuItem key={option.value} value={option.value} primaryText={option.value} />
          ))}
        </SelectField>
      </div>
    )
  }
}

const mapSurveyItemMutationsToProps = () => ({
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

const SurveyItem = connect({
  mapMutationsToProps: mapSurveyItemMutationsToProps
})(SurveyItemBody)

const SurveyColumn = (props) => {
  return (
    <div>
      <h4>Survey Responses</h4>
      {props.data.loading &&
        <p>Loading...</p>
      }
      {props.data.errors && <p>{props.data.errors.message}</p>}
      <div style={{maxHeight: '400px', overflowY: 'scroll'}}>
        {props.data.contact && props.data.contact.questionResponseValues.map(value => {
          return (
            <SurveyItem
              key={value.interactionStepId}
              questionResponse={value}
              contactId={props.data.contact.id}
            />
          )
        })}
      </div>
      {props.data.contact && props.data.contact.questionResponseValues.length === 0 &&
        <p>No survey question responses for this conversation.</p>
      }
    </div>
  )
}

const mapSurveyColumnQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`query getSurveyResponses($contactId: String!) {
      contact(id: $contactId) {
        id
        questionResponseValues {
          interactionStepId
          value
          question {
            text
            answerOptions {
              value
            }
          }
        }
      }
    }`,
    variables: {
      contactId: ownProps.contactId
    },
    forceFetch: true
  }
})

export default connect({
  mapQueriesToProps: mapSurveyColumnQueriesToProps
})(SurveyColumn)
