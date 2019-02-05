import React, { Component } from 'react'
import gql from 'graphql-tag'
import { connect } from 'react-apollo'
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'

class SurveyItem extends Component {
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
  mapMutationsToProps
})(SurveyItem)
