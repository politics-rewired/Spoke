import React from "react";
import * as yup from "yup";
import Form from "react-formal";
import { StyleSheet, css } from "aphrodite";

import FlatButton from "material-ui/FlatButton";

import { dataTest } from "../../../../../lib/attributes";
import GSForm from "../../../../../components/forms/GSForm";
import { ResponseEditorContext } from "../interfaces";
import { CannedResponse } from "../../../../../api/canned-response";


const styles = StyleSheet.create({
  buttonRow: {
    marginTop: 5
  }
});

const modelSchema = yup.object({
  title: yup.string().required(),
  text: yup.string().required()
});

export interface CannedResponseEditorProps {
  editingResponse: CannedResponse;
  customFields: string[];
  onSave(...args: any[]): void;
  onCancel(): void;
}

const CannedResponseEditor: React.SFC<CannedResponseEditorProps> = props => {
  const { customFields, editingResponse, onSave, onCancel } = props;

  const handleSave = (formValues: any) => {
     onSave(formValues); 
  }

  const submitLabel = editingResponse ? 'Edit Response' : 'Add Response'

  return (
    <GSForm schema={modelSchema} onSubmit={handleSave}>
      <Form.Field
        {...dataTest("title")}
        name="title"
        context="responseEditor"
        fullWidth
        label="Title"
        value={editingResponse?.title}
      />
      <Form.Field
        {...dataTest("editorResponse")}
        customFields={customFields}
        name="text"
        context="responseEditor"
        type="script"
        label="Script"
        multiLine
        fullWidth
        value={editingResponse?.text}
      />
      <div className={css(styles.buttonRow)}>
        <Form.Button
          {...dataTest("addResponse")}
          type="submit"
          label={submitLabel}
          style={{
            display: "inline-block"
          }}
        />
        <FlatButton
          label="Cancel"
          onClick={onCancel}
          style={{
            marginLeft: 5,
            display: "inline-block"
          }}
        />
      </div>
    </GSForm>
  );
};

const getLabels = (context: ResponseEditorContext) => {
  switch(context) {
    case ResponseEditorContext.CreatingResponse:
      return {  };
    case ResponseEditorContext.EditingResponse:
      return 'Edit Canned Response';
    default:
      return "Error: unknown context"
  }
} 

export default CannedResponseEditor;

    // <div>
    //     <TextField
    //       name="title"
    //       floatingLabelText="Response title"
    //       fullWidth
    //       value={editingResponse.title}
    //       onChange={(e: any) => onEditCannedResponse(ResponseEditKey.Title, e.target.value)}
    //     />
    //     <GSScriptField
    //       name="text"
    //       label="Text"
    //       fullWidth
    //       customFields={customFields}
    //       value={editingResponse.text}
    //       onChange={wrapOnEditResponse}
    //     />
    //   <div className={css(styles.buttonRow)}>
    //     <FlatButton
    //       label="Save"
    //       primary
    //       onClick={onSaveResponseEdit}
    //       style={{
    //         display: "inline-block"
    //       }}
    //     />
    //     <FlatButton
    //       label="Cancel"
    //       onClick={onCancel}
    //       style={{
    //         marginLeft: 5,
    //         display: "inline-block"
    //       }}
    //     />
    //   </div>
    // </div>