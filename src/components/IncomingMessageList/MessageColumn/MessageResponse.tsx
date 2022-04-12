import { ApolloQueryResult, gql } from "@apollo/client";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import FlatButton from "material-ui/FlatButton";
import React, { Component } from "react";
import * as yup from "yup";

import { Conversation } from "../../../api/conversations";
import { Message } from "../../../api/message";
import { MessageInput } from "../../../api/types";
import { loadData } from "../../../containers/hoc/with-operations";
import { MutationMap } from "../../../network/types";
import GSForm from "../../forms/GSForm";
import SpokeFormField from "../../forms/SpokeFormField";
import MessageLengthInfo from "../../MessageLengthInfo";
import SendButton from "../../SendButton";

interface InnerProps {
  conversation: Conversation;
  value?: string;
  onChange?: (value: string) => Promise<void> | void;
  messagesChanged(messages: Message[]): Promise<void> | void;
}

interface HocProps {
  mutations: {
    sendMessage(
      message: MessageInput,
      campaignContactId: string
    ): ApolloQueryResult<any>;
  };
}

interface Props extends InnerProps, HocProps {}

interface State {
  isSending: boolean;
  sendError: string;
}

class MessageResponse extends Component<Props, State> {
  state: State = {
    isSending: false,
    sendError: ""
  };

  messageForm: HTMLFormElement | null = null;

  createMessageToContact = (text: string) => {
    const { contact, texter } = this.props.conversation;

    return {
      assignmentId: contact.assignmentId,
      contactNumber: contact.cell,
      userId: texter.id,
      text
    };
  };

  handleMessageFormChange = ({ messageText }: MessageFormValue) =>
    this.props.onChange?.(messageText);

  handleMessageFormSubmit = async ({ messageText }: MessageFormValue) => {
    const { contact } = this.props.conversation;
    const message = this.createMessageToContact(messageText);
    if (this.state.isSending) {
      return; // stops from multi-send
    }
    this.setState({ isSending: true });

    try {
      const response = await this.props.mutations.sendMessage(
        message,
        contact.id
      );
      const { messages } = response.data.sendMessage;
      this.props.messagesChanged(messages);
      this.props.onChange?.("");
    } catch (e) {
      this.setState({ sendError: e.message });
    } finally {
      this.setState({ isSending: false });
    }
  };

  handleCloseErrorDialog = () => this.setState({ sendError: "" });

  handleClickSendMessageButton = () => {
    if (this.messageForm) {
      this.messageForm.submit();
    }
  };

  render() {
    const messageSchema = yup.object({
      messageText: yup
        .string()
        .required("Can't send empty message")
        .max(window.MAX_MESSAGE_LENGTH)
    });

    const { isSending } = this.state;
    const isSendDisabled = isSending || this.props.value?.trim() === "";

    const errorActions = [
      <FlatButton
        key="ok"
        label="OK"
        primary
        onClick={this.handleCloseErrorDialog}
      />
    ];

    return (
      <div>
        <GSForm
          ref={(ref: HTMLFormElement) => {
            this.messageForm = ref;
          }}
          schema={messageSchema}
          value={{ messageText: this.props.value ?? "" }}
          onSubmit={this.handleMessageFormSubmit}
          onChange={this.handleMessageFormChange}
        >
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <SpokeFormField
                name="messageText"
                label="Send a response"
                multiLine
                fullWidth
                disabled={isSending}
                rowsMax={6}
                style={{ flexGrow: "1" }}
              />
              <MessageLengthInfo messageText={this.props.value} />
            </div>
            <SendButton
              threeClickEnabled={false}
              onFinalTouchTap={this.handleClickSendMessageButton}
              disabled={isSendDisabled}
              style={{ flexShrink: 1, marginBottom: 10 }}
            />
          </div>
        </GSForm>
        <Dialog open={!!this.state.sendError}>
          <DialogTitle>Error Sending</DialogTitle>
          <DialogContent>
            <DialogContentText>{this.state.sendError}</DialogContentText>
          </DialogContent>
          <DialogActions>{errorActions}</DialogActions>
        </Dialog>
      </div>
    );
  }
}

const mutations: MutationMap<InnerProps> = {
  sendMessage: () => (message: MessageInput, campaignContactId: string) => ({
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
};

export default loadData({ mutations })(MessageResponse);
