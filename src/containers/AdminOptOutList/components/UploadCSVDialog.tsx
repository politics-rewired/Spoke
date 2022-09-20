import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import PublishIcon from "@material-ui/icons/Publish";
import React, { useState } from "react";
import { FileDrop } from "react-file-drop";

import type { BulkOptParams } from "./types";
import { DialogMode } from "./types";

interface UploadCSVDialogProps {
  open: boolean;
  mode: DialogMode;
  onClose(): void;
  onSubmit(params: BulkOptParams): void;
}

const UploadCSVDialog: React.FC<UploadCSVDialogProps> = ({
  open,
  mode,
  onClose,
  onSubmit
}) => {
  const [file, setFile] = useState<File | null>(null);

  const dialogTitle = () => {
    switch (mode) {
      case DialogMode.OptIn:
        return "Upload Opt Ins";
      case DialogMode.OptOut:
        return "Upload Opt Outs";
      default:
        return "";
    }
  };

  const handleFileDrop = (files: FileList | null) => {
    const droppedFile = (files || [])[0];
    setFile(droppedFile);
  };

  const handleOnSelectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = (event.target.files || [])[0];
    setFile(selectedFile);
  };

  const handleSubmit = () => {
    onSubmit({ csvFile: file });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{dialogTitle()}</DialogTitle>
      <DialogContent style={{ width: 300 }}>
        <DialogContentText>
          <FileDrop onDrop={handleFileDrop} targetClassName="file-drop-target">
            <p>{file ? file.name : "Drop a csv here, or"}</p>
            <label htmlFor="csv-upload-field">
              <input
                id="csv-upload-field"
                type="file"
                accept=".csv"
                onChange={handleOnSelectFile}
                hidden
              />
              <Button
                variant="contained"
                color="primary"
                component="span"
                endIcon={<PublishIcon />}
              >
                Select a file
              </Button>
            </label>
          </FileDrop>
        </DialogContentText>
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

export default UploadCSVDialog;
