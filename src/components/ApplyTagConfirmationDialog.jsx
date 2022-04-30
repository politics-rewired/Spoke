import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import PropTypes from "prop-types";
import React, { Component } from "react";
import ReactMarkdown from "react-markdown";

class ApplyTagConfirmationDialog extends Component {
  state = {
    confirmStepIndex: 0
  };

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { pendingTag: lastTag } = this.props;
    const { pendingTag: nextTag } = nextProps;
    const isNewTag = lastTag === undefined && nextTag !== undefined;
    const isDifferentTag = lastTag && nextTag && lastTag.id !== nextTag.id;
    if (isNewTag || isDifferentTag) {
      // eslint-disable-next-line react/no-direct-mutation-state
      this.state.confirmStepIndex = 0;
    }
  }

  handleRequestClose = () => this.props.onCancel();

  handleConfirmStep = () => {
    const { confirmStepIndex } = this.state;
    const { pendingTag } = this.props;
    const { confirmationSteps } = pendingTag;

    if (confirmStepIndex < confirmationSteps.length - 1) {
      return this.setState({ confirmStepIndex: confirmStepIndex + 1 });
    }

    this.props.onConfirm(pendingTag);
  };

  render() {
    const { pendingTag } = this.props;
    let { confirmStepIndex } = this.state;

    const { confirmationSteps = [["", "null", "null"]] } = pendingTag || {};
    confirmStepIndex = Math.min(confirmStepIndex, confirmationSteps.length - 1);
    const [content, confirm, cancel] = confirmationSteps[confirmStepIndex];
    const confirmTagActions = [
      <Button key="confirm" color="primary" onClick={this.handleConfirmStep}>
        {confirm}
      </Button>,
      <Button key="cancel" color="primary" onClick={this.handleRequestClose}>
        {cancel}
      </Button>
    ];

    return (
      <Dialog open={pendingTag !== undefined} onClose={this.handleRequestClose}>
        <DialogTitle>Confirm Add Tag</DialogTitle>
        <DialogContent>
          <ReactMarkdown>{content}</ReactMarkdown>
        </DialogContent>
        <DialogActions>{confirmTagActions}</DialogActions>
      </Dialog>
    );
  }
}

ApplyTagConfirmationDialog.defaultProps = {};

ApplyTagConfirmationDialog.propTypes = {
  pendingTag: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    confirmationSteps: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string))
      .isRequired
  }),
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default ApplyTagConfirmationDialog;
