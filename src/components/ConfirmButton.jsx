import { css, StyleSheet } from "aphrodite";
import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
import RaisedButton from "material-ui/RaisedButton";
import PropTypes from "prop-types";
import React, { Component } from "react";

// This is because the Toolbar from material-ui seems to only apply the correct margins if the
// immediate child is a Button or other type it recognizes. Can get rid of this if we remove material-ui
const styles = StyleSheet.create({
  container: {
    display: "inline-block",
    marginLeft: 20
  }
});

export default class ConfirmButton extends Component {
  state = {
    showConfirmationDialog: false
  };

  toggleConfirmationDialog = () => {
    this.setState({
      showConfirmationDialog: !this.state.showConfirmationDialog
    });
  };

  handleConfirm = async () => {
    await this.props.onConfirm();
    this.toggleConfirmationDialog();
  };

  render() {
    const actions = [
      <FlatButton
        key="no"
        label="No"
        primary
        onClick={this.toggleConfirmationDialog}
      />,
      <FlatButton key="yes" label="Yes" primary onClick={this.handleConfirm} />
    ];

    return (
      <div className={css(styles.container)}>
        <RaisedButton
          onClick={this.toggleConfirmationDialog}
          label={this.props.label}
        />
        <Dialog
          title={this.props.label}
          actions={actions}
          open={this.state.showConfirmationDialog}
          modal
        >
          Are you sure?
        </Dialog>
      </div>
    );
  }
}

ConfirmButton.propTypes = {
  onConfirm: PropTypes.func,
  label: PropTypes.string
};
