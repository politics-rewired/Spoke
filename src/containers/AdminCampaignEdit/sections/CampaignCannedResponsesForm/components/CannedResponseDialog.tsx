import Dialog from "material-ui/Dialog";
import React from "react";

import { ResponseEditorContext } from "../interfaces";
import CannedResponseEditor, {
  CannedResponseEditorProps
} from "./CannedResponseEditor";

export interface CannedResponseDialogProps extends CannedResponseEditorProps {
  open: boolean;
  context: ResponseEditorContext;
}

const CannedResponseDialog: React.SFC<CannedResponseDialogProps> = (props) => {
  const { open, context } = props;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const title = getTitleContext(context);

  return (
    <Dialog open={open} title={title}>
      <CannedResponseEditor {...props} />
    </Dialog>
  );
};

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

export default CannedResponseDialog;
