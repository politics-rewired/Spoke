import React, { Component } from "react";

import { Conversation } from "../../../api/conversations";
import { Message } from "../../../api/message";
import MessageList from "./MessageList";
import MessageOptOut from "./MessageOptOut";
import MessageResponse from "./MessageResponse";

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1
  }
};

interface Props {
  organizationId: string;
  conversation: Conversation;
}

interface State {
  isOptedOut: boolean;
  messages: Message[];
}

class MessageColumn extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const { conversation } = props;
    const isOptedOut =
      conversation.contact.optOut && !!conversation.contact.optOut.cell;
    this.state = {
      messages: conversation.contact.messages,
      isOptedOut
    };
  }

  messagesChanged = (messages: Message[]) => {
    this.setState({ messages });
  };

  optOutChanged = (isOptedOut: boolean) => {
    this.setState({ isOptedOut });
  };

  render() {
    const { messages, isOptedOut } = this.state;
    const { conversation } = this.props;
    const { contact } = conversation;

    return (
      <div style={styles.container}>
        <h4>Messages</h4>
        <MessageList
          messages={messages}
          organizationId={this.props.organizationId}
        />
        {!isOptedOut && (
          <MessageResponse
            conversation={conversation}
            messagesChanged={this.messagesChanged}
          />
        )}
        <MessageOptOut
          contact={contact}
          isOptedOut={isOptedOut}
          optOutChanged={this.optOutChanged}
        />
      </div>
    );
  }
}

export default MessageColumn;
