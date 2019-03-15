import React, { Component } from 'react'
import PropTypes from 'prop-types'
import moment from 'moment-timezone'
import loadData from '../../../containers/hoc/load-data'
import gql from 'graphql-tag'
import { StyleSheet, css } from 'aphrodite'

const styles = StyleSheet.create({
  conversationRow: {
    color: 'white',
    padding: '10px',
    borderRadius: '5px',
    fontWeight: 'normal',
  }
})

class MessageList extends Component {
  componentDidMount() {
    this.refs.messageWindow.scrollTo(0, this.refs.messageWindow.scrollHeight)
  }

  componentDidUpdate() {
    this.refs.messageWindow.scrollTo(0, this.refs.messageWindow.scrollHeight)
  }

  render() {
    return  (
      <div ref="messageWindow" style={{maxHeight: '380px', overflowY: 'scroll'}}>
        {this.props.messages.map((message, index) => {
          const isFromContact = message.isFromContact
          const containerStyle = {
            marginLeft: isFromContact ? undefined : '60px',
            marginRight: isFromContact ? '60px' : undefined
          }

          const messageStyle = {
            backgroundColor: isFromContact ? '#AAAAAA' : 'rgb(33, 150, 243)',
            marginBottom: 0
          }

          const senderInfoStyle = {
            fontSize: 'smaller',
            marginTop: 0
          }

          const sender = this.props.userNames.peopleByUserIds.users.filter(user => user.id === message.userId)[0]
          const senderName = sender ? sender.displayName : 'Unknown'

          return (
            <div style={containerStyle}>
              <p key={index} className={css(styles.conversationRow)} style={messageStyle}>
                {message.text}
              </p>
              <p style={senderInfoStyle}>
                {message.isFromContact
                  ? `Received at ${moment(message.createdAt).fromNow()}`
                  : `Sent by ${senderName} ${moment(message.createdAt).fromNow()}`
                }
              </p>
            </div>
          )
        })}
      </div>
    )
  }
}

MessageList.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.object),
}

const mapQueriesToProps = ({ ownProps }) => ({
  userNames: {
    query: gql`query getPeopleWithIds($userIds: [String!], $organizationId: String!) {
      peopleByUserIds(userIds: $userIds, organizationId: $organizationId) {
        users {
          id
          displayName
        }
      }
    }`,
    variables: {
      userIds: [...new Set(ownProps.messages.map(m => m.userId).filter(uid => !!uid))],
      organizationId: ownProps.organizationId
    }
  }
})

export default loadData(MessageList, { mapQueriesToProps })