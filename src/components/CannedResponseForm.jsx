import type from "prop-types";
import React from "react";
import * as yup from "yup";

import GSForm from "./forms/GSForm";
import SpokeFormField from "./forms/SpokeFormField";

class CannedResponseForm extends React.Component {
  handleSave = (formValues) => {
    const { onSaveCannedResponse } = this.props;
    onSaveCannedResponse(formValues);
  };

  render() {
    const modelSchema = yup.object({
      title: yup.string().required(),
      text: yup.string().required()
    });

    const { customFields, campaignVariables, integrationSourced } = this.props;
    return (
      <div>
        <GSForm ref="form" schema={modelSchema} onSubmit={this.handleSave}>
          <SpokeFormField name="title" autoFocus fullWidth label="Title" />
          <SpokeFormField
            customFields={customFields}
            campaginVariables={campaignVariables}
            integrationSourced={integrationSourced}
            name="text"
            type="script"
            label="Script"
            multiLine
            fullWidth
          />
        </GSForm>
      </div>
    );
  }
}

CannedResponseForm.propTypes = {
  onSaveCannedResponse: type.func,
  customFields: type.array
};

export default CannedResponseForm;
