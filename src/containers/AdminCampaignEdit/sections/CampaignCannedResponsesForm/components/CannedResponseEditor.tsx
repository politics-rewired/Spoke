import React from "react";
import { StyleSheet, css } from "aphrodite";

import FlatButton from "material-ui/FlatButton";
import TextField from "material-ui/TextField";

import GSScriptField from "../../../../../components/forms/GSScriptField";
import { CannedResponseEditorProps, ResponseEditKey } from "../interfaces";


const styles = StyleSheet.create({
  buttonRow: {
    marginTop: 5
  }
});

const CannedResponseEditor: React.SFC<CannedResponseEditorProps> = props => {
  const { customFields, editingResponse, onEditCannedResponse, onSaveResponseEdit, onCancel } = props;

  // get script value from GSScriptField component
  const wrapOnEditResponse = (text: string) => {
    onEditCannedResponse(ResponseEditKey.Text, text)
  }

  return (
    <div>
        <TextField
          name="title"
          floatingLabelText="Response title"
          fullWidth
          value={editingResponse.title}
          onChange={(e: any) => onEditCannedResponse(ResponseEditKey.Title, e.target.value)}
        />
        <GSScriptField
          name="text"
          label="Text"
          fullWidth
          customFields={customFields}
          value={editingResponse.text}
          onChange={wrapOnEditResponse}
        />
      <div className={css(styles.buttonRow)}>
        <FlatButton
          label="Save"
          primary
          onClick={onSaveResponseEdit}
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
    </div>
  );
};

export default CannedResponseEditor;