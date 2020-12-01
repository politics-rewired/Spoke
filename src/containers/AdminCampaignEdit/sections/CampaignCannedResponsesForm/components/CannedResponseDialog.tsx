import React from "react";

import Dialog from "material-ui/Dialog";
import CreateCannedResponseForm from "./CreateCannedResponseForm";
import { CannedResponse } from "../../../../../api/canned-response";
import CannedResponseEditor from "./CannedResponseEditor";

export enum ResponseEditorContext {
  CreatingResponse = 'creating-response',
  EditingResponse = 'editing-response'
}

export interface CannedResponseProps {
  open: boolean;
  context: ResponseEditorContext;
  onCancel(): void;
  onSaveCannedResponse(...args: any[]): void;
  customFields: string[];
  editedResponse?: CannedResponse;
  onEditCannedResponse(e: any, value: string): void;
  onSaveResponseEdit(): void;
  onCancelResponseEdit(): void;
}


const CannedResponseDialog: React.SFC<CannedResponseProps> = props => {
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

// typeGuards for determining context
const isCreatingResponseContext = (
  context: ResponseEditorContext
): context is ResponseEditorContext.CreatingResponse => {
  return context === ResponseEditorContext.CreatingResponse;
};

const isEditingResponseContext = (
  context: ResponseEditorContext
): context is ResponseEditorContext.EditingResponse => {
  return context === ResponseEditorContext.EditingResponse;
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

