import {
  ConversationInfoFragment,
  ConversationMessageFragment
} from "@spoke/spoke-codegen";
import isNil from "lodash/isNil";
import React, { useEffect, useState } from "react";

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
  conversation: ConversationInfoFragment;
}

const MessageColumn: React.FC<Props> = (props) => {
  const { organizationId, conversation } = props;
  const { contact } = conversation;

  const [isOptedOut, setIsOptedOut] = useState(
    !isNil(conversation.contact.optOut?.cell)
  );
  const [messages, setMessages] = useState<ConversationMessageFragment[]>([]);

  useEffect(() => {
    setMessages(conversation.contact.messages);
  }, [setMessages]);

  return (
    <div style={styles.container}>
      <h4>Messages</h4>
      <MessageList messages={messages} organizationId={organizationId} />
      {!isOptedOut && (
        <MessageResponse
          conversation={conversation}
          messagesChanged={setMessages}
        />
      )}
      <MessageOptOut
        contact={contact}
        isOptedOut={isOptedOut}
        optOutChanged={setIsOptedOut}
      />
    </div>
  );
};

export default MessageColumn;
