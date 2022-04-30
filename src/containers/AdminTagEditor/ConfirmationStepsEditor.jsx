import Chip from "@material-ui/core/Chip";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import FlatButton from "material-ui/FlatButton";
import PropTypes from "prop-types";
import React, { Component } from "react";

import CreateConfirmationStepForm from "./CreateConfirmationStepForm";

class ConfirmationStepsEditor extends Component {
  state = {
    isCreatingStep: false
  };

  handleToggleStepCreatorOpen = () => {
    this.setState({ isCreatingStep: !this.state.isCreatingStep });
  };

  render() {
    const {
      confirmationSteps,
      handleSaveStep,
      handleDeleteStep,
      handleToggleStepsEditorOpen,
      open
    } = this.props;

    const { isCreatingStep } = this.state;

    const actions = [
      <FlatButton
        key="close"
        label="Close Step Editor"
        onClick={handleToggleStepsEditorOpen}
      />
    ];

    return (
      <div>
        {isCreatingStep ? (
          <CreateConfirmationStepForm
            handleToggleStepCreatorOpen={this.handleToggleStepCreatorOpen}
            handleSaveStep={handleSaveStep}
            open={isCreatingStep}
          />
        ) : (
          <Dialog open={open} onClose={handleToggleStepsEditorOpen}>
            <DialogTitle>Tag confirmation steps</DialogTitle>
            <DialogContent>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ display: "flex", flexDirection: "row" }}>
                  {confirmationSteps.map((stepArray, stepArrayIdx) => (
                    <Chip
                      key={stepArray[0]}
                      label={stepArray[0]}
                      style={{ margin: 4 }}
                      onDelete={() => handleDeleteStep(stepArrayIdx)}
                    />
                  ))}
                </div>
                <FlatButton
                  label="Add New Step"
                  onClick={this.handleToggleStepCreatorOpen}
                />
              </div>
            </DialogContent>
            <DialogActions>{actions}</DialogActions>
          </Dialog>
        )}
      </div>
    );
  }
}

ConfirmationStepsEditor.propTypes = {
  confirmationSteps: PropTypes.arrayOf(PropTypes.array).isRequired,
  handleSaveStep: PropTypes.func.isRequired,
  handleDeleteStep: PropTypes.func.isRequired,
  handleToggleStepsEditorOpen: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired
};

export default ConfirmationStepsEditor;
