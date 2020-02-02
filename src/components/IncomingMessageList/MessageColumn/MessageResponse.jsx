import React, { Component } from "react";
import PropTypes from "prop-types";
import Form from "react-formal";
import * as yup from "yup";
import gql from "graphql-tag";
import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";

import loadData from "../../../containers/hoc/load-data";
import wrapMutations from "../../../containers/hoc/wrap-mutations";
import GSForm from "../../forms/GSForm";
import SendButton from "../../SendButton";

class MessageResponse extends Component {
  constructor(props) {
    super(props);

    this.state = {
      messageText: "",
      isSending: false,
      sendError: ""
    };

    this.handleCloseErrorDialog = this.handleCloseErrorDialog.bind(this);
  }

  createMessageToContact(text) {
    const { contact, texter } = this.props.conversation;

    return {
      assignmentId: contact.assignmentId,
      contactNumber: contact.cell,
      userId: texter.id,
      text
    };
  }

  handleMessageFormChange = ({ messageText }) => this.setState({ messageText });

  handleMessageFormSubmit = async ({ messageText }) => {
    const { contact } = this.props.conversation;
    const message = this.createMessageToContact(messageText);
    if (this.state.isSending) {
      return; // stops from multi-send
    }
    this.setState({ isSending: true });

    const finalState = { isSending: false };
    try {
      const response = await this.props.mutations.sendMessage(
        message,
        contact.id
      );
      const { messages } = response.data.sendMessage;
      this.props.messagesChanged(messages);
      finalState.messageText = "";
    } catch (e) {
      finalState.sendError = e.message;
    }

    this.setState(finalState);
  };

  handleCloseErrorDialog() {
    this.setState({ sendError: "" });
  }

  handleClickSendMessageButton = () => {
    this.refs.messageForm.submit();
  };

  render() {
    const messageSchema = yup.object({
      messageText: yup
        .string()
        .required("Can't send empty message")
        .max(window.MAX_MESSAGE_LENGTH)
    });

    const { messageText, isSending } = this.state;
    const isSendDisabled = isSending || messageText.trim() === "";

    const errorActions = [
      <FlatButton
        label="OK"
        primary={true}
        onClick={this.handleCloseErrorDialog}
      />
    ];

    return (
      <div>
        <GSForm
          ref="messageForm"
          schema={messageSchema}
          value={{ messageText: this.state.messageText }}
          onSubmit={this.handleMessageFormSubmit}
          onChange={this.handleMessageFormChange}
        >
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <Form.Field
              name="messageText"
              label="Send a response"
              multiLine
              fullWidth
              disabled={isSending}
              rowsMax={6}
              style={{ flexGrow: "1" }}
            />
            <SendButton
              threeClickEnabled={false}
              onFinalTouchTap={this.handleClickSendMessageButton}
              disabled={isSendDisabled}
              style={{ flexShrink: "1" }}
            />
          </div>
        </GSForm>
        <Dialog
          title="Error Sending"
          open={!!this.state.sendError}
          actions={errorActions}
          modal={false}
        >
          <p>{this.state.sendError}</p>
        </Dialog>
      </div>
    );
  }
}

MessageResponse.propTypes = {
  conversation: PropTypes.object,
  messagesChanged: PropTypes.func
};

const mapMutationsToProps = () => ({
  sendMessage: (message, campaignContactId) => ({
    mutation: gql`
      mutation sendMessage(
        $message: MessageInput!
        $campaignContactId: String!
      ) {
        sendMessage(message: $message, campaignContactId: $campaignContactId) {
          id
          messageStatus
          messages {
            id
            createdAt
            userId
            text
            isFromContact
          }
        }
      }
    `,
    variables: {
      message,
      campaignContactId
    }
  })
});

export default loadData(wrapMutations(MessageResponse), {
  mapMutationsToProps
});
