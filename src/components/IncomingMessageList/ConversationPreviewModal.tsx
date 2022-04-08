import Button from "@material-ui/core/Button";
import CardActions from "@material-ui/core/CardActions";
import IconButton from "@material-ui/core/IconButton";
import Paper from "@material-ui/core/Paper";
import ChevronLeft from "@material-ui/icons/ChevronLeft";
import ChevronRight from "@material-ui/icons/ChevronRight";
import CloseIcon from "@material-ui/icons/Close";
import { ConversationInfoFragment } from "@spoke/spoke-codegen";
import { css, StyleSheet } from "aphrodite";
import React from "react";

import MessageColumn from "./MessageColumn";
import SurveyColumn from "./SurveyColumn";

interface ConversationPreviewHeaderProps {
  campaignTitle?: string;
  onRequestClose: () => Promise<void> | void;
}

const ConversationPreviewHeader: React.FC<ConversationPreviewHeaderProps> = ({
  campaignTitle,
  onRequestClose
}) => (
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
    <Button endIcon={<CloseIcon />} onClick={onRequestClose}>
      Close
    </Button>
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

interface ConversationPreviewBodyProps {
  organizationId: string;
  conversation: ConversationInfoFragment;
}

const ConversationPreviewBody: React.FC<ConversationPreviewBodyProps> = ({
  conversation,
  organizationId
}) => (
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

interface ConversationPreviewModalProps {
  organizationId: string;
  conversation: ConversationInfoFragment;
  navigation?: {
    previous: boolean;
    next: boolean;
  };
  onRequestPrevious: () => Promise<void> | void;
  onRequestNext: () => Promise<void> | void;
  onRequestClose: () => Promise<void> | void;
}

const ConversationPreviewModal: React.FC<ConversationPreviewModalProps> = (
  props
) => {
  const {
    conversation,
    navigation = { previous: false, next: false },
    onRequestPrevious = () => {},
    onRequestNext = () => {},
    onRequestClose = () => {}
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
        zIndex: 1000
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <ConversationPreviewHeader
        campaignTitle={conversation.campaign?.title ?? undefined}
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

export default ConversationPreviewModal;
