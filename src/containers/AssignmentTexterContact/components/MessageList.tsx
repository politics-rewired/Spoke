import { red } from "@material-ui/core/colors";
import Divider from "@material-ui/core/Divider";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import { makeStyles } from "@material-ui/core/styles";
import NotInterestedIcon from "@material-ui/icons/NotInterested";
import type { CampaignContact } from "@spoke/spoke-codegen";
import clsx from "clsx";
import React from "react";

import { DateTime } from "../../../lib/datetime";

const useStyles = makeStyles((theme) => ({
  optOut: {
    fontSize: "13px",
    fontStyle: "italic"
  },
  bubble: {
    width: "auto",
    padding: "10px",
    borderRadius: "5px",
    marginBottom: "10px"
  },
  messageText: {
    color: theme.palette.common.white,
    fontSize: "15px",
    fontWeight: "normal"
  },
  messageTimeText: {
    color: theme.palette.grey[200],
    fontSize: "13px",
    fontWeight: "normal"
  },
  sentBubble: {
    marginRight: "10px",
    marginLeft: "20%",
    backgroundColor: theme.palette.inboundMessageBg?.main,
    // Mobile
    "@media(maxWidth: 450px)": {
      marginLeft: "30px"
    }
  },
  receivedBubble: {
    marginLeft: "10px",
    marginRight: "20%",
    backgroundColor: theme.palette.grey[500],
    // Mobile
    "@media(maxWidth: 450px)": {
      marginRight: "30px"
    }
  }
}));

interface MessageListProps {
  contact: CampaignContact;
}

const MessageList: React.FC<MessageListProps> = (props) => {
  const {
    contact: { optOut, messages, firstName }
  } = props;

  const classes = useStyles();

  const optOutItem = optOut ? (
    <>
      <Divider />
      <ListItem className={classes.optOut} disabled>
        <ListItemIcon>
          <NotInterestedIcon style={{ color: red[300] }} />
        </ListItemIcon>
        <ListItemText
          primary={`${firstName} opted out of texts`}
          secondary={DateTime.fromISO(optOut.createdAt).toRelative()}
          primaryTypographyProps={{ className: classes.messageText }}
          secondaryTypographyProps={{ className: classes.messageTimeText }}
        />
      </ListItem>
    </>
  ) : null;

  return (
    <List>
      {messages.map((message) => (
        <ListItem
          key={message.id}
          className={clsx(classes.bubble, {
            [classes.receivedBubble]: message.isFromContact,
            [classes.sentBubble]: !message.isFromContact
          })}
        >
          <ListItemText
            primary={
              <span style={{ whiteSpace: "pre-wrap" }}>{message.text}</span>
            }
            secondary={`${DateTime.fromISO(message.createdAt).toRelative()}`}
            primaryTypographyProps={{ className: classes.messageText }}
            secondaryTypographyProps={{ className: classes.messageTimeText }}
          />
        </ListItem>
      ))}
      {optOutItem}
    </List>
  );
};

export default MessageList;
