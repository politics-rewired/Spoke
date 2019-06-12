import React, { Component } from "react";
import PropTypes from "prop-types";
import RaisedButton from "material-ui/RaisedButton";
import FlatButton from "material-ui/FlatButton";
import Dialog from "material-ui/Dialog";

const EscalateStep = Object.freeze({ None: 0, FAQ: 1, Slack: 2, Escalate: 3 });

const dialogBodyForStep = step => {
  switch (step) {
    case EscalateStep.FAQ:
      const { EXTERNAL_FAQ_URL } = window;
      return (
        <p>
          Have you checked the{" "}
          {EXTERNAL_FAQ_URL ? (
            <a href={EXTERNAL_FAQ_URL} target="_blank">
              FAQ
            </a>
          ) : (
            "FAQ"
          )}
          ?
        </p>
      );
    case EscalateStep.Slack:
      return <p>Have you asked in Slack?</p>;
    case EscalateStep.Escalate:
      return <p>Okay, escalate!</p>;

    default:
      return "";
  }
};

const buttonTitlesForStep = step => {
  switch (step) {
    case EscalateStep.Escalate:
      return { confirm: "Escalate", cancel: "Cancel" };

    default:
      return { confirm: "Yes", cancel: "No, I will try that" };
  }
};

class EscalateButton extends Component {
  state = {
    step: EscalateStep.None
  };

  handleCloseDialog = () => this.setState({ step: EscalateStep.None });

  handleAdvanceStep = () => {
    const { onEscalate } = this.props;
    let { step } = this.state;

    step = step + 1;
    this.setState({ step: step % 4 });

    if (step > 3 && onEscalate) {
      onEscalate();
    }
  };

  render() {
    const { step } = this.state;

    const buttonTitles = buttonTitlesForStep(step);
    const actions = [
      <FlatButton
        label={buttonTitles.confirm}
        primary
        onClick={this.handleAdvanceStep}
      />,
      <FlatButton
        label={buttonTitles.cancel}
        primary
        onClick={this.handleCloseDialog}
      />
    ];

    return (
      <div>
        <RaisedButton
          label="Escalate"
          labelColor="#FFFFFF"
          backgroundColor="#F00000"
          onTouchTap={this.handleAdvanceStep}
        />
        <Dialog
          title="Confirm Escalation"
          open={step !== EscalateStep.None}
          actions={actions}
          onRequestClose={this.handleCloseDialog}
        >
          <p>
            Escalation is meant for situations where you have exhausted all
            available help resources and still do not know how to respond.
          </p>
          {dialogBodyForStep(step)}
        </Dialog>
      </div>
    );
  }
}

EscalateButton.propTypes = {
  onEscalate: PropTypes.func.isRequired
};

export default EscalateButton;
