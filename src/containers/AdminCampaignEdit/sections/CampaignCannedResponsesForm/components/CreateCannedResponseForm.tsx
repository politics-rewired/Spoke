import { css, StyleSheet } from "aphrodite";
import FlatButton from "material-ui/FlatButton";
import React from "react";
import Form from "react-formal";
import * as yup from "yup";

import GSForm from "../../../../../components/forms/GSForm";
import { dataTest } from "../../../../../lib/attributes";
import { ResponseEditorContext } from "./CannedResponseDialog";
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

interface Props {
  onCancel(): void;
  onSaveCannedResponse(...args: any[]): void;
  customFields: string[];
  context: ResponseEditorContext;
  editingResponse?: CannedResponse;
}

const CreateCannedResponseForm: React.SFC<Props> = props => {
  const { context, onSaveCannedResponse, customFields, editingResponse } = props;
  const handleSave = (formValues: any) => 
    onSaveCannedResponse(formValues);

  // const responseContext = context === ResponseEditorContext.CreatingResponse && 'Add' ||
  //   context === ResponseEditorContext.EditingResponse && 'Edit'

  const responseContext = 'add'

  console.log('resp form editingResponse', editingResponse)

  return (
    <GSForm schema={modelSchema} onSubmit={handleSave}>
      <Form.Field
        {...dataTest("title")}
        name="title"
        autoFocus
        fullWidth
        label="Title"
      />
      <Form.Field
        {...dataTest("editorResponse")}
        customFields={customFields}
        name="text"
        type="script"
        label="Script"
        multiLine
        fullWidth
      />
      <div className={css(styles.buttonRow)}>
        <Form.Button
          {...dataTest("addResponse")}
          type="submit"
          label={`${responseContext} Response`}
          style={{
            display: "inline-block"
          }}
        />
        <FlatButton
          label="Cancel"
          onClick={props.onCancel}
          style={{
            marginLeft: 5,
            display: "inline-block"
          }}
        />
      </div>
    </GSForm>
  );
};

export default CreateCannedResponseForm;
