import { css, StyleSheet } from "aphrodite";
import FlatButton from "material-ui/FlatButton";
import React from "react";
import Form from "react-formal";
import * as yup from "yup";

import GSForm from "../../../../../components/forms/GSForm";
import { CreatedCannedResponseFormProps } from "../interfaces";

const styles = StyleSheet.create({
  buttonRow: {
    marginTop: 5
  }
});

const modelSchema = yup.object({
  title: yup.string().required(),
  text: yup.string().required()
});

const CreateCannedResponseForm: React.SFC<CreatedCannedResponseFormProps> = props => {
  const { customFields, onSaveCannedResponse, onCancel  } = props;
  const handleSave = (formValues: any) => 
    onSaveCannedResponse(formValues);

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
          label="Add response"
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

export default CreateCannedResponseForm;
