import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-apollo'
import gql from 'graphql-tag'
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

  handleClickOptIn = async () => {
    const { contact } = this.props,
          { cell } = contact

    this.setState({
      isDisabled: true,
      isConfirmationOpen: false
    })

    const result = await this.props.mutations.removeOptOut(cell)
    this.setState({isDisabled: false})
    if (result.errors) {
      console.error(result.errors)
    } else if (result.data) {
      this.props.handleOptIn()
    }
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
  contact: PropTypes.object,
  handleOptIn: PropTypes.func
}

const mapMutationsToProps = () => ({
  removeOptOut: (cell) => ({
    mutation: gql`
      mutation removeOptOut($cell:Phone!) {
        removeOptOut(cell:$cell)
      }
    `,
    variables: { cell }
  })
})

export default connect({
  mapMutationsToProps
})(MessageOptOut)
