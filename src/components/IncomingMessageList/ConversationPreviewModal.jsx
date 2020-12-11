import { css, StyleSheet } from "aphrodite";
import { CardActions } from "material-ui/Card";
import FlatButton from "material-ui/FlatButton";
import IconButton from "material-ui/IconButton";
import Paper from "material-ui/Paper";
import ChevronLeft from "material-ui/svg-icons/navigation/chevron-left";
import ChevronRight from "material-ui/svg-icons/navigation/chevron-right";
import CloseIcon from "material-ui/svg-icons/navigation/close";
import PropTypes from "prop-types";
import React from "react";

import MessageColumn from "./MessageColumn";
import SurveyColumn from "./SurveyColumn";

const ConversationPreviewHeader = ({ campaignTitle, onRequestClose }) => (
  <div
    style={{
      display: "flex",
      alignItems: "baseline",
      padding: "0 10px"
    }}
  >
    <h2>
      {campaignTitle
        ? `Conversation Review: ${campaignTitle}`
        : "Conversation Review"}
    </h2>
    <span style={{ flex: "1" }} />
    <FlatButton
      label="Close"
      labelPosition="before"
      icon={<CloseIcon />}
      onClick={onRequestClose}
    />
  </div>
);

const columnStyles = StyleSheet.create({
  container: {
    display: "flex",
    flex: "1 1 auto"
  },
  column: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: "0 10px 0 10px"
  }
});

const ConversationPreviewBody = ({ conversation, organizationId }) => (
  <div className={css(columnStyles.container)}>
    <div className={css(columnStyles.column)}>
      <MessageColumn
        conversation={conversation}
        organizationId={organizationId}
      />
    </div>
    <div className={css(columnStyles.column)}>
      <SurveyColumn
        contact={conversation.contact}
        campaign={conversation.campaign}
        organizationId={organizationId}
      />
    </div>
  </div>
);

ConversationPreviewBody.propTypes = {
  conversation: PropTypes.object.isRequired,
  organizationId: PropTypes.string.isRequired
};

const ConversationPreviewModal = (props) => {
  const {
    conversation,
    navigation,
    onRequestPrevious,
    onRequestNext,
    onRequestClose
  } = props;
  const isOpen = conversation !== undefined;

  return (
    <Paper
      style={{
        display: isOpen ? "flex" : "none",
        flexDirection: "column",
        position: "fixed",
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px",
        zIndex: "1000"
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <ConversationPreviewHeader
        campaignTitle={conversation && conversation.campaign.title}
        onRequestClose={onRequestClose}
      />
      <div style={{ flex: "1 1 auto", display: "flex" }}>
        {isOpen && (
          <ConversationPreviewBody
            key={conversation.contact.id}
            conversation={conversation}
            organizationId={props.organizationId}
          />
        )}
      </div>
      <CardActions>
        <IconButton disabled={!navigation.previous} onClick={onRequestPrevious}>
          <ChevronLeft />
        </IconButton>
        <IconButton disabled={!navigation.next} onClick={onRequestNext}>
          <ChevronRight />
        </IconButton>
      </CardActions>
    </Paper>
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
