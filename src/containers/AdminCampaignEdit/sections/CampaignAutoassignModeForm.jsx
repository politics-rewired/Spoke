import React from "react";
import PropTypes from "prop-types";
import * as yup from "yup";
import Form from "react-formal";

import Toggle from "material-ui/Toggle";

import GSForm from "../../../components/forms/GSForm";
import CampaignFormSectionHeading from "../components/CampaignFormSectionHeading";

const formSchema = yup.object({
  isAutoassignEnabled: yup.boolean()
});

class CampaignAutoassignModeForm extends React.Component {
  onIsAutoassignEnabledDidToggle = (_event, isAutoassignEnabled) => {
    this.props.onChange({ isAutoassignEnabled });
  };

  render() {
    const {
      saveLabel,
      saveDisabled,
      formValues,
      onChange,
      onSubmit
    } = this.props;

    return (
      <GSForm
        schema={formSchema}
        value={formValues}
        onChange={onChange}
        onSubmit={onSubmit}
      >
        <CampaignFormSectionHeading
          title="Autoassign mode for campaign"
          subtitle="Please configure whether this campaign is eligible for autoassignment."
        />

        <Form.Field
          name={"isAutoassignEnabled"}
          type={Toggle}
          defaultToggled={formValues["isAutoassignEnabled"]}
          label={"Is autoassign enabled for this campaign?"}
          onToggle={this.onIsAutoassignEnabledDidToggle}
        />

        <Form.Button type="submit" disabled={saveDisabled} label={saveLabel} />
      </GSForm>
    );
  }
}

CampaignAutoassignModeForm.propTypes = {
  saveLabel: PropTypes.string,
  saveDisabled: PropTypes.bool,
  formValues: PropTypes.object,
  onChange: PropTypes.func,
  onSubmit: PropTypes.func
};

export default CampaignAutoassignModeForm;
