import React, { Component } from "react";
import PropTypes from "prop-types";

import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
import CreateConfirmationStepForm from "./CreateConfirmationStepForm";
import { Chip } from "material-ui";

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
          <Dialog
            title="Tag confirmation steps"
            open={open}
            modal={false}
            actions={actions}
            onRequestClose={handleToggleStepsEditorOpen}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ display: "flex", flexDirection: "row" }}>
                {confirmationSteps.map((stepArray, stepArrayIdx) => (
                  <Chip
                    key={stepArrayIdx}
                    onRequestDelete={() => handleDeleteStep(stepArrayIdx)}
                    style={{ margin: 4 }}
                  >
                    {stepArray[0]}
                  </Chip>
                ))}
              </div>
              <FlatButton
                label="Add New Step"
                onClick={this.handleToggleStepCreatorOpen}
              />
            </div>
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
