import { css, StyleSheet } from "aphrodite";
import gql from "graphql-tag";
import moment from "moment-timezone";
import React, { Component } from "react";

import { Message } from "../../../api/message";
import { loadData } from "../../../containers/hoc/with-operations";
import { QueryMap } from "../../../network/types";

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
          const senderName = sender ? sender.displayName : "Unknown";

          return (
            <div key={message.id} style={containerStyle}>
              <p className={css(styles.conversationRow)} style={messageStyle}>
                {message.text}
              </p>
              <p style={senderInfoStyle}>
                {message.isFromContact
                  ? `Received at ${moment(message.createdAt).fromNow()}`
                  : message.sendStatus === "ERROR"
                  ? `Carrier rejected this message sent by ${senderName} at ${moment(
                      message.createdAt
                    ).fromNow()}`
                  : `Sent by ${senderName} ${moment(
                      message.createdAt
                    ).fromNow()}`}
              </p>
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
