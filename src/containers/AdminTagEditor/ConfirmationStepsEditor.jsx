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

  handleOpenStepCreator = () => {
    this.setState({ isCreatingStep: !this.state.isCreatingStep });
  };

  render() {
    const {
      confirmationSteps,
      handleSaveSteps,
      handleDeleteStep,
      handleOpenStepsEditor,
      open
    } = this.props;

    const actions = [
      <FlatButton label="Cancel" onClick={handleOpenStepsEditor} />,
      <FlatButton label="Save" primary onClick={handleOpenStepsEditor} />
    ];

    const { isCreatingStep } = this.state;

    return (
      <div>
        {isCreatingStep ? (
          <CreateConfirmationStepForm
            handleOpenStepCreator={this.handleOpenStepCreator}
            handleSaveStep={handleSaveSteps}
            open={isCreatingStep}
          />
        ) : (
          <Dialog
            title="Tag confirmation steps"
            open={open}
            modal={false}
            actions={actions}
            onRequestClose={handleOpenStepsEditor}
            style={{ zIndex: 999999 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{display: "flex", flexDirection: 'row' }}>
              {confirmationSteps.map((stepArray, stepArrayIdx) => (
                <Chip
                  onRequestDelete={() =>
                    handleDeleteStep(stepArrayIdx)
                  }
                  style={{ margin: 4}}
                >
                  {stepArray[0]}
                </Chip>
              ))}
              </div>
              <FlatButton
                label="Add New Step"
                onClick={this.handleOpenStepCreator}
              />
            </div>
          </Dialog>
        )}
      </div>
    );
  }
}

ConfirmationStepsEditor.propTypes = {
  confirmationSteps: PropTypes.arrayOf(PropTypes.string).isRequired,
  handleSaveSteps: PropTypes.func.isRequired,
  handleDeleteStep: PropTypes.func.isRequired,
  handleOpenStepsEditor: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired
};

export default ConfirmationStepsEditor;
