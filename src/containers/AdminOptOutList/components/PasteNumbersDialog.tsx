import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import TextareaAutosize from "@material-ui/core/TextareaAutosize";
import React, { useState } from "react";

import type { BulkOptParams } from "./types";
import { DialogMode } from "./types";

interface PasteNumbersDialogProps {
  open: boolean;
  mode: DialogMode;
  onClose(): void;
  onSubmit(params: BulkOptParams): void;
}

const PasteNumbersDialog: React.FC<PasteNumbersDialogProps> = ({
  open,
  mode,
  onClose,
  onSubmit
}) => {
  const [numbers, setNumbers] = useState<string>("");

  const dialogTitle = () => {
    switch (mode) {
      case DialogMode.OptIn:
        return "Paste Opt Ins";
      case DialogMode.OptOut:
        return "Paste Opt Outs";
      default:
        return "";
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNumbers(event.target.value);
  };

  const handleSubmit = () => {
    onSubmit({ numbersList: numbers });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{dialogTitle()}</DialogTitle>
      <DialogContent style={{ maxHeight: "70vh" }}>
        <DialogContentText>
          Paste the phone numbers you would like to opt out below. Numbers can
          be separated by a new line or a comma.
          <br /> <br />
          Phone numbers in all conventional formats are permitted; non-numeric
          characters (e.g. dashes and parentheses) can be optionally included.
        </DialogContentText>
        <TextareaAutosize
          value={numbers}
          style={{ width: "100%" }}
          minRows={15}
          onChange={handleChange}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} color="primary">
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PasteNumbersDialog;
