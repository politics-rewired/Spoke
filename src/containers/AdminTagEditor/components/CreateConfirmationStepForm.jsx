import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import { css, StyleSheet } from "aphrodite";
import PropTypes from "prop-types";
import React from "react";
import Form from "react-formal";
import * as yup from "yup";

import GSForm from "../../../components/forms/GSForm";
import SpokeFormField from "../../../components/forms/SpokeFormField";

const styles = StyleSheet.create({
  formFields: {
    display: "flex",
    flexDirection: "column"
  },
  buttons: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end"
  }
});

const formSchema = yup.object({
  confirmationBodyText: yup.string().required(),
  confirmButtonText: yup.string().required(),
  cancelButtonText: yup.string().required()
});

const CreateConfirmationStepForm = (props) => {
  const { handleSaveStep, handleToggleStepCreatorOpen, open } = props;

  const handleSubmit = (formValues) => {
    const newStep = [];
    const formKeys = Object.keys(formValues);
    formKeys.forEach((key) => newStep.push(formValues[key]));
    handleSaveStep(newStep);
    handleToggleStepCreatorOpen();
  };

  return (
    <Dialog open={open} onClose={handleToggleStepCreatorOpen}>
      <DialogTitle>New confirmation step</DialogTitle>
      <GSForm schema={formSchema} onSubmit={handleSubmit}>
        <DialogContent>
          <div className={css(styles.formFields)}>
            <SpokeFormField
              label="Confirmation Body Text"
              name="confirmationBodyText"
            />
            <SpokeFormField
              label="Confirm Button Text"
              name="confirmButtonText"
            />
            <SpokeFormField
              label="Cancel Button Text"
              name="cancelButtonText"
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Form.Submit label="Cancel" onClick={handleToggleStepCreatorOpen} />
          <Form.Submit type="submit" label="Save New Confirmation Step" />
        </DialogActions>
      </GSForm>
    </Dialog>
  );
};

CreateConfirmationStepForm.propTypes = {
  handleToggleStepCreatorOpen: PropTypes.func.isRequired,
  handleSaveStep: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired
};

export default CreateConfirmationStepForm;
