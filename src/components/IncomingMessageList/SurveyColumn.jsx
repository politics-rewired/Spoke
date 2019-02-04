import React from 'react'
import gql from 'graphql-tag'
import { connect } from 'react-apollo'
import SelectField from 'material-ui/SelectField'
import MenuItem from 'material-ui/MenuItem'

const SurveyItem = (props) => {
  const { question, value } = props.questionResponse
  return (
    <div>
      <SelectField
        floatingLabelText={question.text}
        value={value}
        style={{ width: '100%' }}
      >
      {question.answerOptions.map(option => (
        <MenuItem key={option.value} value={option.value} primaryText={option.value} />
      ))}
      </SelectField>
    </div>
  )
}

const SurveyColumn = (props) => {
  return (
    <div>
      <h3>Survey Responses</h3>
      {props.data.loading &&
        <p>Loading...</p>
      }
      {props.data.errors && <p>{props.data.errors.message}</p>}
      {props.data.contact && props.data.contact.questionResponseValues.map(value => {
        return <SurveyItem key={value.interactionStepId} questionResponse={value} />
      })}
    </div>
  )
}

const mapQueriesToProps = ({ ownProps }) => ({
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
    }
  }
})

export default connect({
  mapQueriesToProps
})(SurveyColumn)
