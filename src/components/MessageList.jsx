import Divider from "material-ui/Divider";
import { List, ListItem } from "material-ui/List";
import { red300 } from "material-ui/styles/colors";
import ProhibitedIcon from "material-ui/svg-icons/av/not-interested";
import moment from "moment";
import PropTypes from "prop-types";
import React from "react";

const styles = {
  optOut: {
    fontSize: "13px",
    fontStyle: "italic"
  },
  bubble: {
    color: "white",
    padding: "10px",
    borderRadius: "5px",
    marginBottom: "10px",
    fontSize: "15px",
    fontWeight: "normal"
  },
  sentBubble: {
    marginRight: "10px",
    marginLeft: "20%",
    backgroundColor: "rgb(33, 150, 243)",
    // Mobile
    "@media(maxWidth: 450px)": {
      marginLeft: "30px"
    }
  },
  receivedBubble: {
    marginLeft: "10px",
    marginRight: "20%",
    backgroundColor: "#AAAAAA",
    // Mobile
    "@media(maxWidth: 450px)": {
      marginRight: "30px"
    }
  }
};

const MessageList = function MessageList(props) {
  const { contact } = props;
  const { optOut, messages } = contact;

  const optOutItem = optOut ? (
    <div>
      <Divider />
      <ListItem
        style={styles.optOut}
        leftIcon={<ProhibitedIcon style={{ fill: red300 }} />}
        disabled
        primaryText={`${contact.firstName} opted out of texts`}
        secondaryText={moment(optOut.createdAt).fromNow()}
      />
    </div>
  ) : (
    ""
  );

  return (
    <List>
      {messages.map((message) => {
        const specialStyle = message.isFromContact
          ? styles.receivedBubble
          : styles.sentBubble;
        const style = { ...styles.bubble, ...specialStyle };
        return (
          <ListItem
            disabled
            style={style}
            key={message.id}
            primaryText={
              <span style={{ whiteSpace: "pre-wrap" }}>{message.text}</span>
            }
            secondaryText={`${moment(message.createdAt).fromNow()}`}
          />
        );
      })}
      {optOutItem}
    </List>
  );
};

MessageList.propTypes = {
  contact: PropTypes.object
};

export default MessageList;
