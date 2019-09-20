import React from "react";
import PropTypes from "prop-types";
import { StyleSheet, css } from "aphrodite";
import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
import IconButton from "material-ui/IconButton";
import ChevronLeft from "material-ui/svg-icons/navigation/chevron-left";
import ChevronRight from "material-ui/svg-icons/navigation/chevron-right";

import MessageColumn from "./MessageColumn";
import SurveyColumn from "./SurveyColumn";

const headerStyles = {
  container: {
    display: "flex",
    alignItems: "baseline"
  },
  heading: { flex: "1" }
};

const columnStyles = StyleSheet.create({
  container: {
    display: "flex"
  },
  column: {
    flex: 1,
    padding: "0 10px 0 10px"
  },
  conversationRow: {
    color: "white",
    padding: "10px",
    borderRadius: "5px",
    fontWeight: "normal"
  }
});

const ConversationPreviewBody = props => {
  const { conversation, organizationId } = props,
    { contact, campaign } = conversation;
  return (
    <div className={css(columnStyles.container)}>
      <div className={css(columnStyles.column)}>
        <MessageColumn
          conversation={conversation}
          organizationId={organizationId}
        />
      </div>
      <div className={css(columnStyles.column)}>
        <SurveyColumn
          contact={contact}
          campaign={campaign}
          organizationId={organizationId}
        />
      </div>
    </div>
  );
};

ConversationPreviewBody.propTypes = {
  conversation: PropTypes.object.isRequired,
  organizationId: PropTypes.string.isRequired
};

const ConversationPreviewModal = props => {
  const {
      conversation,
      navigation,
      onRequestPrevious,
      onRequestNext,
      onRequestClose
    } = props,
    isOpen = conversation !== undefined;

  const primaryActions = [
    <FlatButton label="Close" primary={true} onClick={onRequestClose} />
  ];

  const customContentStyle = {
    width: "100%",
    maxWidth: "none"
  };

  const title = (
    <div style={headerStyles.container}>
      <div style={headerStyles.heading}>
        {conversation
          ? `Conversation Review: ${conversation.campaign.title}`
          : "Conversation Review"}
      </div>
      <IconButton disabled={!navigation.previous} onClick={onRequestPrevious}>
        <ChevronLeft />
      </IconButton>
      <IconButton disabled={!navigation.next} onClick={onRequestNext}>
        <ChevronRight />
      </IconButton>
    </div>
  );

  return (
    <Dialog
      title={title}
      open={isOpen}
      actions={primaryActions}
      modal={false}
      contentStyle={customContentStyle}
      onRequestClose={onRequestClose}
    >
      {isOpen && (
        <ConversationPreviewBody
          key={conversation.contact.id}
          conversation={conversation}
          organizationId={props.organizationId}
        />
      )}
    </Dialog>
  );
};

ConversationPreviewModal.defaultProps = {
  navigation: { previous: false, next: false },
  onRequestPrevious: () => {},
  onRequestNext: () => {},
  onRequestClose: () => {}
};

ConversationPreviewModal.propTypes = {
  organizationId: PropTypes.string.isRequired,
  conversation: PropTypes.object,
  navigation: PropTypes.shape({
    previous: PropTypes.bool.isRequired,
    next: PropTypes.bool.isRequired
  }),
  onRequestPrevious: PropTypes.func,
  onRequestNext: PropTypes.func,
  onRequestClose: PropTypes.func
};

export default ConversationPreviewModal;
