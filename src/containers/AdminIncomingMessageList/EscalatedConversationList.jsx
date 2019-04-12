import React from 'react'
import gql from 'graphql-tag'

import loadData from '../hoc/load-data'
import AdminIncomingMessageList from '.'

const EscalatedConversationList = (props) => {
  const { escalationUserId } = props.data.organization
  if (escalationUserId) {
    return <AdminIncomingMessageList escalationUserId={escalationUserId} {...props} />
  }

  return <h3>No user specified as the designated escalated user in Settings!</h3>
}

const mapQueriesToProps = ({ ownProps }) => ({
  data: {
    query: gql`query getEscalationUserId($organizationId: String!) {
      organization(id: $organizationId) {
        id
        escalationUserId
      }
    }`,
    variables: {
      organizationId: ownProps.params.organizationId
    }
  }
})

export default loadData(EscalatedConversationList, { mapQueriesToProps })
