import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import React from "react";

// dialogs stack on top of each other when all are open as:
// opt out language warning > link warning > script editor
const styles = {
  dialog: {
    zIndex: 10002
  }
};

export enum ScriptWarningContext {
  GenericLink = "generic-link",
  ShortLink = "short-link"
}

interface ContentProps {
  warningContext: ScriptWarningContext;
}

const DialogContentWrapper = (props: ContentProps) => {
  const { warningContext } = props;

  const genericLinkContent = (
    <div>
      It looks like you're sending a message that includes a link.
      <br />
      <p>
        Be sure to read our advice{" "}
        <a
          href="https://docs.spokerewired.com/article/113-sending-links"
          target="_blank"
          rel="noopener noreferrer"
        >
          here
        </a>
        .
      </p>
    </div>
  );

  const shortLinkContent = (
    <div>
      <div>
        It looks like you're sending a message that includes a link shortener.
      </div>
      <div style={{ display: "flex" }}>
        For better deliverability, we
        <div style={{ color: "red" }}>&nbsp;strongly&nbsp;</div>
        advise against this.
      </div>
      <p>
        If you need to insert a short link into your message, be sure to read
        the docs{" "}
        <a
          href="https://docs.spokerewired.com/article/113-sending-links"
          target="_blank"
          rel="noopener noreferrer"
        >
          here
        </a>
        .
      </p>
    </div>
  );

  switch (warningContext) {
    case ScriptWarningContext.GenericLink:
      return genericLinkContent;
    case ScriptWarningContext.ShortLink:
      return shortLinkContent;
    default:
      return <p>Error: unknown context</p>;
  }
};

export interface WarningProps {
  open: boolean;
  warningContext: ScriptWarningContext;
  handleConfirm: () => void;
  handleClose: () => void;
}

const ScriptLinkWarningDialog = ({
  warningContext,
  handleClose,
  handleConfirm,
  open
}: WarningProps) => {
  const title =
    (warningContext === ScriptWarningContext.GenericLink && "Confirm Script") ||
    (warningContext === ScriptWarningContext.ShortLink && "Short Link Warning");

  const actions = [
    <Button key="close" onClick={handleClose}>
      Close
    </Button>,
    <Button key="save" color="primary" onClick={handleConfirm}>
      Confirm and Save
    </Button>
  ];

  return (
    <Dialog open={open} style={styles.dialog}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentWrapper warningContext={warningContext} />
      </DialogContent>
      <DialogActions>{actions}</DialogActions>
    </Dialog>
  );
};

export default ScriptLinkWarningDialog;
