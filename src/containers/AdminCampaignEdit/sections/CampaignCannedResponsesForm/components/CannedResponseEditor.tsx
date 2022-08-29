import Button from "@material-ui/core/Button";
import { css, StyleSheet } from "aphrodite";
import React from "react";
import Form from "react-formal";
import * as yup from "yup";

import type { CampaignVariable } from "../../../../../api/campaign-variable";
import type { CannedResponse } from "../../../../../api/canned-response";
import GSForm from "../../../../../components/forms/GSForm";
import SpokeFormField from "../../../../../components/forms/SpokeFormField";
import { dataTest } from "../../../../../lib/attributes";

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
  campaignVariables: CampaignVariable[];
  integrationSourced: boolean;
  onSave(...args: any[]): void;
  onCancel(): void;
}

const CannedResponseEditor: React.SFC<CannedResponseEditorProps> = (props) => {
  const {
    customFields,
    campaignVariables,
    integrationSourced,
    editingResponse,
    onSave,
    onCancel
  } = props;

  const handleSave = (formValues: any) => {
    onSave(formValues);
  };

  const submitLabel = editingResponse ? "Edit Response" : "Add Response";

  return (
    <GSForm schema={modelSchema} onSubmit={handleSave}>
      <SpokeFormField
        {...dataTest("title")}
        name="title"
        context="responseEditor"
        fullWidth
        label="Title"
        value={editingResponse?.title}
      />
      <SpokeFormField
        {...dataTest("editorResponse")}
        customFields={customFields}
        campaignVariables={campaignVariables}
        integrationSourced={integrationSourced}
        name="text"
        context="responseEditor"
        type="script"
        label="Script"
        multiLine
        fullWidth
        value={editingResponse?.text}
      />
      <div className={css(styles.buttonRow)}>
        <Form.Submit
          {...dataTest("addResponse")}
          type="submit"
          label={submitLabel}
          style={{
            display: "inline-block"
          }}
        />
        <Button
          onClick={onCancel}
          style={{
            marginLeft: 5,
            display: "inline-block"
          }}
        >
          Cancel
        </Button>
      </div>
    </GSForm>
  );
};

export default CannedResponseEditor;
