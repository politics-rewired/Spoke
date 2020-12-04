import React from "react";

import Dialog from "material-ui/Dialog";

import CannedResponseEditor, { CannedResponseEditorProps } from "./CannedResponseEditor";
import { ResponseEditorContext  } from "../interfaces";

export interface CannedResponseDialogProps extends CannedResponseEditorProps {
  open: boolean;
  context: ResponseEditorContext;
}

const CannedResponseDialog: React.SFC<CannedResponseDialogProps> = props => {
  const { open, context } = props;

  const title = getTitleContext(context)

  return (
    <Dialog open={open} title={title} >
      <CannedResponseEditor {...props} />
    </Dialog>
  )
};

const getTitleContext = (context: ResponseEditorContext) => {
  switch(context) {
    case ResponseEditorContext.CreatingResponse:
      return 'Create Canned Response';
    case ResponseEditorContext.EditingResponse:
      return 'Edit Canned Response';
    default:
      return "Error: unknown context"
  }
} 

export default CannedResponseDialog;

