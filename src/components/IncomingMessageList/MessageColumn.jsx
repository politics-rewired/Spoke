import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { StyleSheet, css } from 'aphrodite'

import MessageResponse from './MessageResponse'
import MessageOptOut from './MessageOptOut'

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
      <div ref="messageWindow" style={{maxHeight: '400px', overflowY: 'scroll'}}>
        {this.props.messages.map((message, index) => {
          const isFromContact = message.isFromContact
          const messageStyle = {
            marginLeft: isFromContact ? undefined : '60px',
            marginRight: isFromContact ? '60px' : undefined,
            backgroundColor: isFromContact ? '#AAAAAA' : 'rgb(33, 150, 243)',
          }

          return (
            <p key={index} className={css(styles.conversationRow)} style={messageStyle}>
              {message.text}
            </p>
          )
        })}
      </div>
    )
  }
}

MessageList.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.object),
}

const MessageColumn = (props) => {
  const { isOptedOut } = props
  const { contact } = props.conversation
  return (
    <div>
      <h4>Messages</h4>
      <MessageList messages={props.messages} />
      {!isOptedOut &&
        <MessageResponse conversation={props.conversation} messagesChanged={props.messagesChanged} />
      }
      {isOptedOut &&
        <MessageOptOut contact={contact} handleOptIn={props.handleOptIn} />
      }
    </div>
  )
}

export default MessageColumn
