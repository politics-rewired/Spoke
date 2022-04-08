import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import {
  ConversationInfoFragment,
  ConversationMessageFragment
} from "@spoke/spoke-codegen";
import isNil from "lodash/isNil";
import React, { useCallback, useEffect, useState } from "react";
import CannedResponseMenu from "src/components/CannedResponseMenu";

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

type ClickButtonHandler = React.MouseEventHandler<HTMLButtonElement>;

interface Props {
  organizationId: string;
  conversation: ConversationInfoFragment;
}

const MessageColumn: React.FC<Props> = (props) => {
  const { organizationId, conversation } = props;
  const { contact } = conversation;

  const [messageText, setMessageText] = useState("");
  const [anchorEl, setAnchorEl] = useState<Element | null>(null);
  const [isOptedOut, setIsOptedOut] = useState(
    !isNil(conversation.contact.optOut?.cell)
  );
  // TODO: use apollo client cache rather than state to manage changes to messages list
  const [messages, setMessages] = useState<ConversationMessageFragment[]>([]);

  useEffect(() => {
    setMessages(conversation.contact.messages);
  }, [setMessages]);

  const handleOpenCannedResponse: ClickButtonHandler = useCallback(
    (event) => {
      setAnchorEl(event.currentTarget);
    },
    [setAnchorEl]
  );

  const handleScriptSelected = useCallback(
    (script: string) => {
      setAnchorEl(null);
      setMessageText(script);
    },
    [setAnchorEl]
  );

  const handleRequestClose = useCallback(() => setAnchorEl(null), [
    setAnchorEl
  ]);

  return (
    <>
      <div style={styles.container}>
        <h4>Messages</h4>
        <MessageList messages={messages} organizationId={organizationId} />
        {!isOptedOut && (
          <MessageResponse
            value={messageText}
            conversation={conversation}
            messagesChanged={setMessages}
            onChange={setMessageText}
          />
        )}
        <Grid container spacing={2} justify="flex-end">
          <Grid item>
            <MessageOptOut
              contact={contact}
              isOptedOut={isOptedOut}
              optOutChanged={setIsOptedOut}
            />
          </Grid>
          {!isOptedOut && (
            <Grid item>
              <Button variant="contained" onClick={handleOpenCannedResponse}>
                Canned Responses
              </Button>
            </Grid>
          )}
        </Grid>
      </div>
      <CannedResponseMenu
        campaignId={conversation.campaign.id ?? undefined}
        anchorEl={anchorEl ?? undefined}
        onSelectCannedResponse={handleScriptSelected}
        onRequestClose={handleRequestClose}
      />
    </>
  );
};

export default MessageColumn;
