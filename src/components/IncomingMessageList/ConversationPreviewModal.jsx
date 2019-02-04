import React, { Component } from 'react'
import PropTypes from 'prop-types'
import gql from 'graphql-tag'
import { StyleSheet, css } from 'aphrodite'
import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'

import loadData from '../../containers/hoc/load-data'
import wrapMutations from '../../containers/hoc/wrap-mutations'
import MessageColumn from './MessageColumn'
import SurveyColumn from './SurveyColumn'

const styles = StyleSheet.create({
  container: {
    display: 'flex',
  },
  column: {
    flex: 1,
    padding: '0 10px 0 10px'
  },
  conversationRow: {
    color: 'white',
    padding: '10px',
    borderRadius: '5px',
    fontWeight: 'normal',
  }
})

class ConversationPreviewBody extends Component {
  constructor(props) {
    super(props)

    this.state = {
      messages: props.conversation.contact.messages
    }

    this.messagesChanged = this.messagesChanged.bind(this)
  }

  messagesChanged(messages) {
    this.setState({ messages })
  }

  render() {
    const contactId = this.props.conversation.contact.id
    return (
      <div className={css(styles.container)}>
        <div className={css(styles.column)}>
          <MessageColumn
            messages={this.state.messages}
            conversation={this.props.conversation}
            messagesChanged={this.messagesChanged}
          />
        </div>
        <div className={css(styles.column)}>
          <SurveyColumn contactId={contactId} />
        </div>
      </div>
    )
  }
}

ConversationPreviewBody.propTypes = {
  conversation: PropTypes.object
}

class ConversationPreviewModal extends Component {
  constructor(props) {
    super(props)

    this.state = {
      optOutError: ''
    }
  }

  handleClickOptOut = async () => {
    const { contact } = this.props.conversation
    const optOut = {
      cell: contact.cell,
      assignmentId: contact.assignmentId
    }
    try {
      const response = await this.props.mutations.createOptOut(optOut, campaignContactId)
      if (response.errors) {
        const errorText = response.errors.join('\n')
        throw new Error(errorText)
      }
    } catch (error) {
      this.setState({ optOutError: error.message })
    }
  }

  render() {
    const { conversation } = this.props,
          isOpen = conversation !== undefined

    const primaryActions = [
      <FlatButton
        label="Opt-Out"
        secondary={true}
        onClick={this.handleClickOptOut}
      />,
      <FlatButton
        label="Close"
        primary={true}
        onClick={this.props.onRequestClose}
      />
    ]

    const customContentStyle = {
      width: '100%',
      maxWidth: 'none',
    };

    return (
      <Dialog
        title='Conversation Review'
        open={isOpen}
        actions={primaryActions}
        modal={false}
        contentStyle={customContentStyle}
        onRequestClose={this.props.onRequestClose}
      >
        <div>
          {isOpen && <ConversationPreviewBody {...this.props} />}
          <Dialog
            title='Error Opting Out'
            open={!!this.state.optOutError}
            modal={false}
          >
            <p>{this.state.optOutError}</p>
          </Dialog>
        </div>
      </Dialog>
    )
  }
}

ConversationPreviewModal.propTypes = {
  conversation: PropTypes.object,
  onRequestClose: PropTypes.func
}

const mapMutationsToProps = () => ({
  createOptOut: (optOut, campaignContactId) => ({
    mutation: gql`
      mutation createOptOut($optOut: OptOutInput!, $campaignContactId: String!) {
        createOptOut(optOut: $optOut, campaignContactId: $campaignContactId) {
          id
          optOut {
            id
            createdAt
          }
        }
      }
    `,
    variables: {
      optOut,
      campaignContactId
    }
  })
})

export default loadData(wrapMutations(ConversationPreviewModal), {
  mapMutationsToProps
})
