import Button from "@material-ui/core/Button";
import Divider from "@material-ui/core/Divider";
import { css, StyleSheet } from "aphrodite";
import { Card, CardActions, CardTitle } from "material-ui/Card";
import PropTypes from "prop-types";
import React, { Component } from "react";
import Form from "react-formal";
import * as yup from "yup";

import GSForm from "../../../components/forms/GSForm";
import SpokeFormField from "../../../components/forms/SpokeFormField";

const FIELD_NAME = "messageText";

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
    if (this.contactActionTextRef) {
      return this.contactActionTextRef.querySelectorAll(
        `textarea[name="${FIELD_NAME}"]`
      )[0];
    }
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
            <div
              ref={(el) => {
                this.contactActionTextRef = el;
              }}
            >
              <SpokeFormField name={FIELD_NAME} fullWidth autoFocus multiLine />
            </div>
            <div className={css(styles.dialogActions)}>
              <Button
                style={inlineStyles.dialogButton}
                onClick={handleCloseDialog}
              >
                Cancel
              </Button>
              <Form.Submit
                type="submit"
                label={submitTitle}
                style={inlineStyles.dialogButton}
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
