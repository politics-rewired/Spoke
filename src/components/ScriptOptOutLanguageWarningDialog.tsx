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
    zIndex: 10003
  }
};

const DialogContentWrapper = () => {
  return (
    <div>
      WARNING! This script does not include opt out language. You must let the
      recipient know they can opt out of receiving future texts, or your
      messages are very likely to be blocked as spam. <br /> <br /> We recommend
      a phrase with the individual word STOP, such as "Reply STOP to quit"
      Please see our{" "}
      <a
        href="https://docs.spokerewired.com/article/168-spoke-101-tips-for-a-successful-mass-text"
        target="_blank"
        rel="noopener noreferrer"
      >
        deliverability checklist
      </a>{" "}
      for other best practices for improving deliverability.
    </div>
  );
};

export interface WarningProps {
  open: boolean;
  handleConfirm: () => void;
  handleClose: () => void;
}

const ScriptOptOutLanguageWarningDialog = ({
  handleClose,
  handleConfirm,
  open
}: WarningProps) => {
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
      <DialogTitle>Opt Out Language Warning</DialogTitle>
      <DialogContent>
        <DialogContentWrapper />
      </DialogContent>
      <DialogActions>{actions}</DialogActions>
    </Dialog>
  );
};

export default ScriptOptOutLanguageWarningDialog;
