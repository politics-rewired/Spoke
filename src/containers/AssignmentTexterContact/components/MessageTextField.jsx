import TextField from "@material-ui/core/TextField";
import { css, StyleSheet } from "aphrodite";
import React, { Component } from "react";

import SpokeFormField from "../../../components/forms/SpokeFormField";

const FIELD_NAME = "messageText";

const styles = StyleSheet.create({
  textField: {
    "@media(max-width: 350px)": {
      overflowY: "scroll !important"
    }
  }
});

class MessageTextField extends Component {
  componentDidMount() {
    const messageTextField = this.getMessageFieldRef();
    messageTextField.addEventListener("keydown", this.onEnterDown);
  }

  componentWillUnmount() {
    const messageTextField = this.getMessageFieldRef();
    messageTextField.removeEventListener("keydown", this.onEnterDown);
  }

  getMessageFieldRef = () => {
    // Intercept enter key at the deepest underlying DOM <textarea> leaf
    if (this.messageTextRef !== undefined) {
      return this.messageTextRef.querySelectorAll(
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
    return (
      <div
        ref={(el) => {
          this.messageTextRef = el;
        }}
      >
        <SpokeFormField
          className={css(styles.textField)}
          name={FIELD_NAME}
          label="Your message"
          as={TextField}
          multiline
          fullWidth
          rowsMax={6}
          {...this.props}
        />
      </div>
    );
  }
}

export default MessageTextField;
