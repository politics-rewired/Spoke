import React, { Component } from 'react'
import gql from 'graphql-tag'
import { connect } from 'react-apollo'

import SurveyItem from './SurveyItem'

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
