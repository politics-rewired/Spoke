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
          Paste the numbers below with a single number per line.
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
