import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import React, { useState } from "react";

import PasteNumbersDialog from "./PasteNumbersDialog";
import type { BulkOptParams } from "./types";
import { DialogMode } from "./types";
import UploadCSVDialog from "./UploadCSVDialog";

interface OptionsDialogProps {
  open: boolean;
  dialogMode: DialogMode;
  onClose(): void;
  onSubmit(params: BulkOptParams): void;
}

const OptionsDialog: React.FC<OptionsDialogProps> = ({
  open,
  dialogMode,
  onClose,
  onSubmit
}) => {
  const [pasteDialogOpen, setPasteDialogOpen] = useState<boolean>(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState<boolean>(false);

  const handlePasteDialogOpen = () => {
    onClose();
    setPasteDialogOpen(true);
  };
  const handlePasteDialogClose = () => {
    setPasteDialogOpen(false);
  };

  const handleUploadDialogOpen = () => {
    onClose();
    setUploadDialogOpen(true);
  };
  const handleUploadDialogClose = () => {
    setUploadDialogOpen(false);
  };

  const dialogText = () => {
    switch (dialogMode) {
      case DialogMode.OptIn:
        return "How do you want to import the Opt Ins?";
      case DialogMode.OptOut:
        return "How do you want to import the Opt Outs?";
      default:
        return "";
    }
  };

  const dialogTitle = () => {
    switch (dialogMode) {
      case DialogMode.OptIn:
        return "Importing Opt Ins";
      case DialogMode.OptOut:
        return "Importing Opt Outs";
      default:
        return "";
    }
  };
  return (
    <div>
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>{dialogTitle()}</DialogTitle>
        <DialogContent>
          <DialogContentText>{dialogText()}</DialogContentText>
          <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button color="primary" onClick={handleUploadDialogOpen}>
              Upload CSV
            </Button>
            <Button color="primary" onClick={handlePasteDialogOpen}>
              Paste Numbers
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
      <PasteNumbersDialog
        open={pasteDialogOpen}
        onClose={handlePasteDialogClose}
        mode={dialogMode}
        onSubmit={onSubmit}
      />
      <UploadCSVDialog
        open={uploadDialogOpen}
        onClose={handleUploadDialogClose}
        mode={dialogMode}
        onSubmit={onSubmit}
      />
    </div>
  );
};

export default OptionsDialog;
