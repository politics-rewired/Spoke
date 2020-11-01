import React from "react";
import * as yup from "yup";
import Form from "react-formal";
import { StyleSheet, css } from "aphrodite";

import FlatButton from "material-ui/FlatButton";

import { dataTest } from "../../../../../lib/attributes";
import GSForm from "../../../../../components/forms/GSForm";

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
}

const CreateCannedResponseForm: React.SFC<Props> = (props) => {
  const handleSave = (formValues: any) =>
    props.onSaveCannedResponse(formValues);

  const { customFields } = props;
  return (
    <GSForm ref="form" schema={modelSchema} onSubmit={handleSave}>
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
          label="Add Response"
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
