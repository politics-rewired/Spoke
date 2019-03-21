import React, { Component } from 'react'
import PropTypes from 'prop-types'
import yup from 'yup'
import Form from 'react-formal'
import { StyleSheet, css } from 'aphrodite'
import { Card, CardActions, CardTitle } from 'material-ui/Card'
import Divider from 'material-ui/Divider'
import FlatButton from 'material-ui/FlatButton'

import GSForm from '../../components/forms/GSForm'
import GSSubmitButton from '../../components/forms/GSSubmitButton'

const styles = StyleSheet.create({
  optOutCard: {
    '@media(max-width: 320px)': {
      padding: '2px 10px !important'
    },
    zIndex: 2000,
    backgroundColor: 'white'
  }
})

const inlineStyles = {
  dialogButton: {
    display: 'inline-block'
  }
}

const optOutSchema = yup.object({
  optOutMessageText: yup.string()
})

export default class OptOutDialog extends Component {
  componentDidMount() {
    const optOutField = this.getOptOutFieldRef()
    optOutField.addEventListener('keydown', this.onEnterDown)
  }

  componentWillUnmount() {
    const optOutField = this.getOptOutFieldRef()
    optOutField.removeEventListener('keydown', this.onEnterDown)
  }

  getOptOutFieldRef = () => {
    // Intercept enter key at the deepest underlying DOM <textarea> leaf
    return this.refs.optOutText.refs.input.refs.textField.input.refs.input
  }

  // Allow <shift> + <enter> to add newlines rather than submitting
  onEnterDown = (event) => {
    const keyCode = event.keyCode || event.which
    if (keyCode === 13 && !event.shiftKey) {
      event.preventDefault()
      return false
    }
  }

  render() {
    const { optOutMessageText, onChange, onSubmit, handleCloseDialog } = this.props
    return (
      <Card>
        <CardTitle
          className={css(styles.optOutCard)}
          title='Opt out user'
        />
        <Divider />
        <CardActions className={css(styles.optOutCard)}>
          <GSForm
            className={css(styles.optOutCard)}
            schema={optOutSchema}
            onChange={onChange}
            value={{ optOutMessageText }}
            onSubmit={onSubmit}
          >
            <Form.Field
              ref='optOutText'
              name='optOutMessageText'
              fullWidth
              autoFocus
              multiLine
            />
            <div className={css(styles.dialogActions)}>
              <FlatButton
                style={inlineStyles.dialogButton}
                label='Cancel'
                onTouchTap={handleCloseDialog}
              />
              <Form.Button
                type='submit'
                style={inlineStyles.dialogButton}
                component={GSSubmitButton}
                label={optOutMessageText ? 'Send' : 'Opt Out without Text'}
              />
            </div>
          </GSForm>
        </CardActions>
      </Card>
    )
  }
}

OptOutDialog.propTypes = {
  optOutMessageText: PropTypes.string,
  onChange: PropTypes.func,
  onSubmit: PropTypes.func,
  handleCloseDialog: PropTypes.func
}
