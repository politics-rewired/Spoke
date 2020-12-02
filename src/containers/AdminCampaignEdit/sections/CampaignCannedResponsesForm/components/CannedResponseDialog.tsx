import React from "react";

import Dialog from "material-ui/Dialog";

import CreateCannedResponseForm from "./CreateCannedResponseForm";
import CannedResponseEditor from "./CannedResponseEditor";
import { ResponseEditorContext, CannedResponseDialogProps  } from "../interfaces";

const CannedResponseDialog: React.SFC<CannedResponseDialogProps> = props => {
  const { open, context } = props;

  const title = getTitleContext(context)

  const components = {
    [ResponseEditorContext.CreatingResponse]: <CreateCannedResponseForm {...props} />,
    [ResponseEditorContext.EditingResponse]: <CannedResponseEditor {...props} />
  }

  const Component = components[context]

  return (
    <Dialog open={open} title={title} >
      {Component}
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
      return <p>Error: unknown context</p>
  }
} 

export default CannedResponseDialog;

