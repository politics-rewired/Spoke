import React, { Component } from "react";
import PropTypes from "prop-types";
import gql from "graphql-tag";
import moment from "moment-timezone";
import { StyleSheet, css } from "aphrodite";

import { loadData } from "../../../containers/hoc/with-operations";

const styles = StyleSheet.create({
  conversationRow: {
    color: "white",
    padding: "10px",
    borderRadius: "5px",
    fontWeight: "normal"
  }
});

class MessageList extends Component {
  componentDidMount() {
    if (this.refs.messageWindow) {
      this.refs.messageWindow.scrollTo(0, this.refs.messageWindow.scrollHeight);
    }
  }

  componentDidUpdate() {
    if (this.refs.messageWindow) {
      this.refs.messageWindow.scrollTo(0, this.refs.messageWindow.scrollHeight);
    }
  }

  render() {
    const messageContainerStyle = {
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
      <div ref="messageWindow" style={messageContainerStyle}>
        {this.props.messages.map((message, index) => {
          const isFromContact = message.isFromContact;
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
            (user) => user.id === message.userId
          )[0];
          const senderName = sender ? sender.displayName : "Unknown";

          return (
            <div key={index} style={containerStyle}>
              <p className={css(styles.conversationRow)} style={messageStyle}>
                {message.text}
              </p>
              <p style={senderInfoStyle}>
                {message.isFromContact
                  ? `Received at ${moment(message.createdAt).fromNow()}`
                  : message.sendStatus == "ERROR"
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

MessageList.propTypes = {
  userNames: PropTypes.object.isRequired,
  messages: PropTypes.arrayOf(PropTypes.object).isRequired
};

const queries = {
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
