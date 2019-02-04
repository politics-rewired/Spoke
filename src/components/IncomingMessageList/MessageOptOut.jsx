import React, { Component } from 'react'
import PropTypes from 'prop-types'
import FlatButton from 'material-ui/FlatButton'
import RaisedButton from 'material-ui/RaisedButton'
import Dialog from 'material-ui/Dialog'

class MessageOptOut extends Component {
  constructor(props) {
    super(props)

    this.state = {
      isDisabled: false,
      isConfirmationOpen: false
    }
  }

  openConfirmation = () => {
    this.setState({ isConfirmationOpen: true })
  }

  handleCloseConfirmation = () => {
    this.setState({ isConfirmationOpen: false })
  }

  handleClickOptIn = () => {
    const { contactId } = this.props

    this.setState({
      isDisabled: true,
      isConfirmationOpen: false
    })

    // Fake executing opt-in mutation
    console.log(`Opt-In ${contactId}`)
    setTimeout(() => {
      this.setState({isDisabled: false})
    }, 3000)
  }

  render() {
    const actions = [
      <FlatButton
        label="Cancel"
        primary={true}
        onClick={this.handleCloseConfirmation}
      />,
      <FlatButton
        label="Submit"
        primary={true}
        keyboardFocused={true}
        onClick={this.handleClickOptIn}
      />
    ]

    return (
      <div>
        <RaisedButton
          label="Opt-In"
          backgroundColor="#ff0033"
          disabled={this.state.isDisabled}
          onClick={this.openConfirmation}
          style={{ float: 'right' }}
        />
        <p style={{marginRight: '150px'}}>This user has been opted out. Would you like to opt them back in?</p>
        <Dialog
          title="Confirm Opt-In"
          actions={actions}
          modal={false}
          open={this.state.isConfirmationOpen}
          onRequestClose={this.handleClose}
        >
          Are you sure you would like to opt this contact back in? This will mean they can receive texts from all campaigns.
        </Dialog>
      </div>
    )
  }
}

MessageOptOut.propTypes = {
  contactId: PropTypes.string,
  handleOptIn: PropTypes.func
}

export default MessageOptOut
