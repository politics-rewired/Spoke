import React from "react";
import { StyleSheet, css } from "aphrodite";

import FlatButton from "material-ui/FlatButton";
import TextField from "material-ui/TextField";

import { CannedResponse } from "../../../../../api/canned-response";
import GSScriptField from "../../../../../components/forms/GSScriptField";
import { CannedResponseProps, ResponseEditorContext } from "./CannedResponseDialog";


const styles = StyleSheet.create({
  buttonRow: {
    marginTop: 5
  }
});

export enum ResponseEditKey {
  Title = 'title',
  Text = 'text'
}

const CannedResponseEditor: React.SFC<CannedResponseProps> = props => {
  const { onEditCannedResponse, customFields, editedResponse, onSaveResponseEdit, onCancelResponseEdit } = props;

  const wrapOnEditResposne = (text: string) => {
    onEditCannedResponse(ResponseEditKey.Text, text)
  }

  return (
    <div>
        <TextField
          name="title"
          floatingLabelText="Response title"
          fullWidth
          value={editedResponse && editedResponse.title}
          onChange={(e: any) => onEditCannedResponse(ResponseEditKey.Title, e.target.value)}
        />
        <GSScriptField
          name="text"
          label="Text"
          fullWidth
          customFields={customFields}
          value={editedResponse && editedResponse.text}
          onChange={wrapOnEditResposne}
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
          onClick={onCancelResponseEdit}
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