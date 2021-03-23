import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import React from "react";

import { ResponseEditorContext } from "../interfaces";
import CannedResponseEditor, {
  CannedResponseEditorProps
} from "./CannedResponseEditor";

export interface CannedResponseDialogProps extends CannedResponseEditorProps {
  open: boolean;
  context: ResponseEditorContext;
}

const getTitleContext = (context: ResponseEditorContext) => {
  switch (context) {
    case ResponseEditorContext.CreatingResponse:
      return "Create Canned Response";
    case ResponseEditorContext.EditingResponse:
      return "Edit Canned Response";
    default:
      return "Error: unknown context";
  }
};

const CannedResponseDialog: React.SFC<CannedResponseDialogProps> = (props) => {
  const { open, context } = props;

  const title = getTitleContext(context);

  return (
    <Dialog open={open}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <CannedResponseEditor {...props} />
      </DialogContent>
    </Dialog>
  );
};

export default CannedResponseDialog;
