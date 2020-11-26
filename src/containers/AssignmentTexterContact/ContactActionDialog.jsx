import { css, StyleSheet } from "aphrodite";
import { Card, CardActions, CardTitle } from "material-ui/Card";
import Divider from "material-ui/Divider";
import FlatButton from "material-ui/FlatButton";
import PropTypes from "prop-types";
import React, { Component } from "react";
import Form from "react-formal";
import * as yup from "yup";

import GSForm from "../../components/forms/GSForm";
import GSSubmitButton from "../../components/forms/GSSubmitButton";

const styles = StyleSheet.create({
  contactActionCard: {
    "@media(max-width: 320px)": {
      padding: "2px 10px !important"
    },
    zIndex: 2000,
    backgroundColor: "white"
  }
});

const inlineStyles = {
  dialogButton: {
    display: "inline-block"
  }
};

const contactActionSchema = yup.object({
  messageText: yup.string()
});

class ContactActionDialog extends Component {
  componentDidMount() {
    const contactActionTextField = this.getContactActionTextFieldRef();
    contactActionTextField.addEventListener("keydown", this.onEnterDown);
  }

  componentWillUnmount() {
    const contactActionTextField = this.getContactActionTextFieldRef();
    contactActionTextField.removeEventListener("keydown", this.onEnterDown);
  }

  getContactActionTextFieldRef = () => {
    // Intercept enter key at the deepest underlying DOM <textarea> leaf
    return this.refs.contactActionText.refs.input.refs.textField.input.refs
      .input;
  };

  // Allow <shift> + <enter> to add newlines rather than submitting
  onEnterDown = (event) => {
    const keyCode = event.keyCode || event.which;
    if (keyCode === 13 && !event.shiftKey) {
      event.preventDefault();
      return false;
    }
  };

  render() {
    const {
      title,
      messageText,
      submitTitle,
      onChange,
      onSubmit,
      handleCloseDialog
    } = this.props;
    return (
      <Card>
        <CardTitle className={css(styles.contactActionCard)} title={title} />
        <Divider />
        <CardActions className={css(styles.contactActionCard)}>
          <GSForm
            className={css(styles.contactActionCard)}
            schema={contactActionSchema}
            onChange={onChange}
            value={{ messageText }}
            onSubmit={onSubmit}
          >
            <Form.Field
              ref="contactActionText"
              name="messageText"
              fullWidth
              autoFocus
              multiLine
            />
            <div className={css(styles.dialogActions)}>
              <FlatButton
                style={inlineStyles.dialogButton}
                label="Cancel"
                onTouchTap={handleCloseDialog}
              />
              <Form.Button
                type="submit"
                style={inlineStyles.dialogButton}
                component={GSSubmitButton}
                label={submitTitle}
              />
            </div>
          </GSForm>
        </CardActions>
      </Card>
    );
  }
}

ContactActionDialog.propTypes = {
  title: PropTypes.string.isRequired,
  messageText: PropTypes.string.isRequired,
  submitTitle: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  handleCloseDialog: PropTypes.func.isRequired
};

export default ContactActionDialog;
