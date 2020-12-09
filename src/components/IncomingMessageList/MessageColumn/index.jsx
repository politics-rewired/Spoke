import React, { Component } from "react";

import MessageList from "./MessageList";
import MessageOptOut from "./MessageOptOut";
import MessageResponse from "./MessageResponse";

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1
  }
};

class MessageColumn extends Component {
  constructor(props) {
    super(props);

    const { conversation } = props;
    const isOptedOut =
      conversation.contact.optOut && !!conversation.contact.optOut.cell;
    this.state = {
      messages: conversation.contact.messages,
      isOptedOut
    };
  }

  messagesChanged = (messages) => {
    this.setState({ messages });
  };

  optOutChanged = (isOptedOut) => {
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
