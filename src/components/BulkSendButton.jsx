import { css, StyleSheet } from "aphrodite";
import RaisedButton from "material-ui/RaisedButton";
import PropTypes from "prop-types";
import React, { Component } from "react";

// This is because the Toolbar from material-ui seems to only apply the correct margins if the
// immediate child is a Button or other type it recognizes. Can get rid of this if we remove material-ui
const styles = StyleSheet.create({
  container: {
    display: "inline-block",
    marginLeft: 20
  }
});

export default class BulkSendButton extends Component {
  state = {
    isSending: false
  };

  sendMessages = async () => {
    this.setState({ isSending: true });
    this.props.setDisabled(true);
    await this.props.bulkSendMessages(this.props.assignment.id);
    this.setState({ isSending: false });
    this.props.setDisabled(false);
    this.props.onFinishContact();
  };

  render() {
    return (
      <div className={css(styles.container)}>
        <RaisedButton
          onClick={this.sendMessages}
          label={
            this.state.isSending
              ? "Sending..."
              : `Send Bulk (${window.BULK_SEND_CHUNK_SIZE})`
          }
          disabled={this.state.isSending}
          primary
        />
      </div>
    );
  }
}

BulkSendButton.propTypes = {
  assignment: PropTypes.object,
  onFinishContact: PropTypes.func,
  bulkSendMessages: PropTypes.func,
  setDisabled: PropTypes.func
};
