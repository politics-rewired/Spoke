import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
import React from "react";

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

const DialogContent = (props: ContentProps) => {
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

interface WarningProps {
  open: boolean;
  warningContext: ScriptWarningContext;
  handleConfirm: () => void;
  handleClose: () => void;
}

const ScriptLinkWarningDialog = (props: WarningProps) => {
  const { warningContext, handleClose, handleConfirm, open } = props;

  const title =
    (warningContext === ScriptWarningContext.GenericLink && "Confirm Script") ||
    (warningContext === ScriptWarningContext.ShortLink && "Short Link Warning");

  const actions = [
    <FlatButton
      key="close"
      label="Close"
      primary={false}
      onClick={handleClose}
    />,
    <FlatButton
      key="save"
      label="Confirm and Save"
      primary
      onClick={handleConfirm}
    />
  ];

  return (
    <Dialog open={open} actions={actions} title={title} style={styles.dialog}>
      <DialogContent warningContext={warningContext} />
    </Dialog>
  );
};

export default ScriptLinkWarningDialog;
