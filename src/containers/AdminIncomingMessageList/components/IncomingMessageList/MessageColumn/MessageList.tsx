import { gql } from "@apollo/client";
import { Message, User } from "@spoke/spoke-codegen";
import { css, StyleSheet } from "aphrodite";
import React, { Component } from "react";
import errorCodeDescriptions from "src/lib/telco-error-codes";
import { MessageSendStatus } from "src/server/api/types";

import { DateTime } from "../../../../../lib/datetime";
import { QueryMap } from "../../../../../network/types";
import { loadData } from "../../../../hoc/with-operations";

const styles: Record<string, React.CSSProperties> = StyleSheet.create({
  conversationRow: {
    color: "white",
    padding: "10px",
    borderRadius: "5px",
    fontWeight: "normal"
  }
});

interface Props {
  organizationId: string;
  userNames: any;
  messages: Message[];
}

const footerText = (message: Message, sender: User) => {
  const senderName = sender ? sender.displayName : "Unknown";

  const sentAgoRelative = DateTime.fromISO(message.createdAt).toRelative();

  if (message.isFromContact) {
    return `Received ${sentAgoRelative}`;
  }

  if (message.sendStatus === MessageSendStatus.Error) {
    const errorCode = (message.errorCodes ?? [])[0];

    const errorDesc = errorCodeDescriptions[errorCode] ?? "Unknown error";
    return `Sent by ${senderName} ${sentAgoRelative}. Error: ${errorDesc}.`;
  }

  return `Sent by ${senderName} ${sentAgoRelative}`;
};

class MessageList extends Component<Props> {
  messageWindow: HTMLDivElement | null = null;

  componentDidMount() {
    if (this.messageWindow) {
      this.messageWindow.scrollTo(0, this.messageWindow.scrollHeight);
    }
  }

  componentDidUpdate() {
    if (this.messageWindow) {
      this.messageWindow.scrollTo(0, this.messageWindow.scrollHeight);
    }
  }

  render() {
    const messageContainerStyle: React.CSSProperties = {
      flex: "1 1 auto",
      height: "0px",
      overflowY: "scroll"
    };

    if (this.props.messages.length === 0) {
      return (
        <div style={messageContainerStyle}>
          <p
            style={{
              backgroundColor: "#EEEEEE",
              margin: "0 60px",
              padding: "10px 0",
              textAlign: "center"
            }}
          >
            No messages yet
          </p>
        </div>
      );
    }

    return (
      <div
        ref={(ref) => {
          this.messageWindow = ref;
        }}
        style={messageContainerStyle}
      >
        {this.props.messages.map((message) => {
          const { isFromContact } = message;
          const containerStyle = {
            marginLeft: isFromContact ? undefined : "60px",
            marginRight: isFromContact ? "60px" : undefined
          };

          const messageStyle = {
            backgroundColor: isFromContact ? "#AAAAAA" : "rgb(33, 150, 243)",
            marginBottom: 0
          };

          const senderInfoStyle = {
            fontSize: "smaller",
            marginTop: 0
          };

          const sender = this.props.userNames.peopleByUserIds.users.filter(
            (user: any) => user.id === message.userId
          )[0];

          return (
            <div key={message.id} style={containerStyle}>
              <p className={css(styles.conversationRow)} style={messageStyle}>
                {message.text}
              </p>
              <p style={senderInfoStyle}>{footerText(message, sender)}</p>
            </div>
          );
        })}
      </div>
    );
  }
}

const queries: QueryMap<Props> = {
  userNames: {
    query: gql`
      query getPeopleWithIds($userIds: [String!], $organizationId: String!) {
        peopleByUserIds(userIds: $userIds, organizationId: $organizationId) {
          users {
            id
            displayName
          }
        }
      }
    `,
    options: (ownProps) => ({
      variables: {
        userIds: [
          ...new Set(
            ownProps.messages.map((m) => m.userId).filter((uid) => !!uid)
          )
        ],
        organizationId: ownProps.organizationId
      }
    })
  }
};

export default loadData({ queries })(MessageList);
