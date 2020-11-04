import React from "react";
import PropTypes from "prop-types";
import * as yup from "yup";
import Form from "react-formal";
import { StyleSheet, css } from "aphrodite";

import { Dialog } from "material-ui";

import GSForm from "../../components/forms/GSForm";

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

const CreateConfirmationStepForm = props => {
  const { handleSaveStep, handleOpenStepCreator, open } = props;

  const handleSubmit = formValues => {
    const newStep = [];
    const formKeys = Object.keys(formValues);
    formKeys.forEach(key => newStep.push(formValues[key]));
    handleSaveStep(newStep);
    handleOpenStepCreator();
  };

  return (
    <Dialog
      title="New confirmation step"
      open={open}
      modal={false}
      onRequestClose={handleOpenStepCreator}
      style={{ zIndex: 999999 }}
    >
      <GSForm schema={formSchema} onSubmit={handleSubmit}>
        <div className={css(styles.formFields)}>
          <Form.Field
            label="Confirmation Body Text"
            name="confirmationBodyText"
          />
          <Form.Field label="Confirm Button Text" name="confirmButtonText" />
          <Form.Field label="Cancel Button Text" name="cancelButtonText" />
        </div>

        <div className={css(styles.buttons)}>
          <Form.Button label="Cancel" onClick={handleOpenStepCreator} />
          <Form.Button type="submit" label="Save New Confirmation Step" />
        </div>
      </GSForm>
    </Dialog>
  );
};

CreateConfirmationStepForm.propTypes = {
  handleOpenStepCreator: PropTypes.func.isRequired,
  handleSaveStep: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired
};

export default CreateConfirmationStepForm;
