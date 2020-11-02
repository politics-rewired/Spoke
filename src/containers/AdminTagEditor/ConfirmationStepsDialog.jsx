import React, { Component } from "react";
import PropTypes from "prop-types";

import Dialog from "material-ui/Dialog";
import TextField from "material-ui/TextField";
import FlatButton from "material-ui/FlatButton";

class ConfirmationStepsDialog extends Component {
  render() {
    const {
      confirmationSteps,
      setConfirmationSteps,
      handleSaveSteps,
      handleCancelEditSteps,
      open
    } = this.props;
    const actions = [
      <FlatButton label="Cancel" onClick={handleCancelEditSteps} />,
      <FlatButton label="Save" primary onClick={handleSaveSteps} />
    ];

    const confirmationBodyText =  confirmationSteps[0] || "";
    const confirmButtonText =  confirmationSteps[1] || "";
    const cancelButtonText =  confirmationSteps[2] || "";

    return (
      <Dialog
        title="Confirmation Steps"
        open={open}
        modal={false}
        actions={actions}
        onRequestClose={this.handleOpenStepsEditor}
        style={{ zIndex: 999999 }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <TextField
            name="confirmationBodyText"
            floatingLabelText="Confirmation body text"
            multiLine
            value={confirmationBodyText}
            onChange={setConfirmationSteps}
          />
          <TextField
            name="confirmButtonText"
            floatingLabelText="Confirm button text"
            value={confirmButtonText}
            onChange={setConfirmationSteps}
          />
          <TextField
            name="cancelButtonText"
            floatingLabelText="Cancel button text"
            value={cancelButtonText}
            onChange={setConfirmationSteps}
          />
        </div>
      </Dialog>
    );
  }
}

ConfirmationStepsDialog.propTypes = {
  confirmationSteps: PropTypes.arrayOf(PropTypes.string)
    .isRequired,
  setConfirmationSteps: PropTypes.func.isRequired,
  handleSaveSteps: PropTypes.func.isRequired,
  handleCancelEditSteps: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired
};

export default ConfirmationStepsDialog;
