import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import type { Conversation, Message, MessageInput } from "@spoke/spoke-codegen";
import { useSendMessageMutation } from "@spoke/spoke-codegen";
import React, { useState } from "react";
import * as yup from "yup";

import GSForm from "../../../../../components/forms/GSForm";
import SpokeFormField from "../../../../../components/forms/SpokeFormField";
import MessageLengthInfo from "../../../../../components/MessageLengthInfo";
import SendButton from "../../../../../components/SendButton";

interface MessageResponseProps {
  conversation: Conversation;
  value?: string;
  onChange?: (value: string) => Promise<void> | void;
  messagesChanged(messages: Message[]): Promise<void> | void;
}

const messageSchema = yup.object({
  messageText: yup
    .string()
    .required("Can't send empty message")
    .max(window.MAX_MESSAGE_LENGTH)
});

type MessageFormValue = { messageText: string };

const MessageResponse: React.FC<MessageResponseProps> = ({
  conversation,
  value,
  onChange,
  messagesChanged
}: MessageResponseProps) => {
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendError, setSendError] = useState<string>("");
  const [messageForm, setMessageForm] = useState<HTMLFormElement | null>(null);

  const [sendMessage] = useSendMessageMutation();

  const createMessageToContact = (text: string) => {
    const { contact, texter } = conversation;

    return {
      assignmentId: contact.assignmentId,
      contactNumber: contact.cell,
      userId: texter.id,
      text
    };
  };

  const handleMessageFormChange = ({ messageText }: MessageFormValue) =>
    onChange?.(messageText);

  const handleMessageFormSubmit = async ({ messageText }: MessageFormValue) => {
    const { contact } = conversation;
    const message: MessageInput = createMessageToContact(messageText);
    if (isSending) {
      return; // stops from multi-send
    }
    setIsSending(true);

    try {
      const { data, errors } = await sendMessage({
        variables: { message, campaignContactId: contact.id as string }
      });
      const messages = data?.sendMessage?.messages;

      if (errors) {
        const errorMsgs = errors.map((error) => error.message).join("\n");
        setSendError(errorMsgs);
      }

      if (messages) {
        messagesChanged(messages);
        onChange?.("");
      }
    } catch (e: any) {
      setSendError(e.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleCloseErrorDialog = () => setSendError("");

  const handleClickSendMessageButton = () => {
    if (messageForm) {
      messageForm.submit();
    }
  };

  const isSendDisabled = isSending || value?.trim() === "";

  const errorActions = [
    <Button key="ok" color="primary" onClick={handleCloseErrorDialog}>
      OK
    </Button>
  ];

  return (
    <div>
      <GSForm
        ref={(ref: HTMLFormElement) => {
          setMessageForm(ref);
        }}
        schema={messageSchema}
        value={{ messageText: value ?? "" }}
        onSubmit={handleMessageFormSubmit}
        onChange={handleMessageFormChange}
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
            <MessageLengthInfo messageText={value ?? ""} />
          </div>
          <SendButton
            threeClickEnabled={false}
            onFinalTouchTap={handleClickSendMessageButton}
            disabled={isSendDisabled}
            style={{ flexShrink: 1, marginBottom: 10 }}
          />
        </div>
      </GSForm>
      <Dialog open={!!sendError}>
        <DialogTitle>Error Sending</DialogTitle>
        <DialogContent>
          <DialogContentText>{sendError}</DialogContentText>
        </DialogContent>
        <DialogActions>{errorActions}</DialogActions>
      </Dialog>
    </div>
  );
};

export default MessageResponse;
