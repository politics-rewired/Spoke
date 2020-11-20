import React from "react";
import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";

export enum ScriptWarningContext {
  GenericLink = "generic-link",
  ShortLink = "short-link"
}

interface WarningProps {
  warningContext: ScriptWarningContext;
  handleConfirm: () => void;
  handleClose: () => void;
}

const ScriptLinkWarningDialog = (props: WarningProps) => {
  const { warningContext, handleClose, handleConfirm } = props;

  const title = warningContext === ScriptWarningContext.GenericLink && 'Confirm Script' 
    || warningContext === ScriptWarningContext.ShortLink && 'Short Link Warning'

  const actions = [
    <FlatButton label="Close" primary={false} onClick={handleClose} />,
    <FlatButton label="Confirm and Save" primary={true} onClick={handleConfirm} />
  ];

  return (
    <Dialog open={true} actions={actions} title={title} style={{ zIndex: 9999999}}>
      <DialogContent warningContext={warningContext} />
    </Dialog>
  );
};

interface ContentProps {
  warningContext: ScriptWarningContext
}

const DialogContent = (props: ContentProps) => {
  const { warningContext } = props; 

  const genericLinkContent = (
    <div>
      It looks like you're sending a message that includes a link. 
      <br />
      <p>
        Be sure to read our advice {" "}
          <a
            href="https://docs.spokerewired.com/article/70-short-link-domains"
            target="_blank"
          >
            here
          </a>.
      </p>
    </div>
  )

  const shortLinkContent = (
    <div>
      <div>
        It looks like you're sending a message that includes a link shortener. 
      </div>
        <div style={{ display: 'flex'}}>
          For better deliverability, we
          <div style={{ color: 'red' }}>
            &nbsp;strongly&nbsp;
          </div>
          advise against this.
        </div>
      <p>
       If you need to insert a short link into your message, be sure to read the docs {" "}
        <a
          href="https://docs.spokerewired.com/article/70-short-link-domains"
          target="_blank"
        >
         here
        </a>.
      </p>

    </div>
  )

  const warningContent = 
     warningContext === ScriptWarningContext.GenericLink && genericLinkContent 
    || ScriptWarningContext.ShortLink && shortLinkContent
          
  return warningContent
}

export default ScriptLinkWarningDialog;
