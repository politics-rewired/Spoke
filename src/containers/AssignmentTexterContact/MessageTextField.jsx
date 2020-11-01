import React, { Component } from "react";
import Form from "react-formal";
import { StyleSheet, css } from "aphrodite";

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
    return this.refs.messageText.refs.input.refs.textField.input.refs.input;
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
      <Form.Field
        ref="messageText"
        className={css(styles.textField)}
        name="messageText"
        label="Your message"
        multiLine
        fullWidth
        rowsMax={6}
        {...this.props}
      />
    );
  }
}

export default MessageTextField;
