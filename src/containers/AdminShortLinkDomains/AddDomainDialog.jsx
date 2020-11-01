import React, { Component } from "react";
import PropTypes from "prop-types";

import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
import RaisedButton from "material-ui/RaisedButton";
import TextField from "material-ui/TextField";

class AddDomainDialog extends Component {
  state = {
    domain: "",
    maxUsageCount: 100
  };

  handleDomainChange = (event) => this.setState({ domain: event.target.value });
  handleMaxUsageCountChange = (event) =>
    this.setState({ maxUsageCount: parseInt(event.target.value, 10) });

  handleAddDomainClick = () => {
    const { onAddNewDomain } = this.props;
    const { domain, maxUsageCount } = this.state;
    onAddNewDomain(domain, maxUsageCount);
  };

  render() {
    const { open, onRequestClose } = this.props;
    const { domain, maxUsageCount } = this.state;

    const isDomainValid = domain !== "";
    const isMaxUsageCountValid = maxUsageCount > 0;
    const isSubmitDisabled = !isDomainValid || !isMaxUsageCountValid;

    const actions = [
      <FlatButton label="Close" primary={false} onClick={onRequestClose} />,
      <RaisedButton
        label="Add"
        primary={true}
        disabled={isSubmitDisabled}
        onClick={this.handleAddDomainClick}
      />
    ];

    return (
      <Dialog
        title="Add Domain"
        actions={actions}
        modal={false}
        open={open}
        onRequestClose={onRequestClose}
      >
        <p>Add a new shortlink domain.</p>
        <TextField
          floatingLabelText="Shortlink Domain"
          hintText="bit.ly"
          value={domain}
          errorText={isDomainValid ? undefined : "You must provide a domain."}
          onChange={this.handleDomainChange}
        />
        <br />
        <TextField
          floatingLabelText="Shortlink Domain"
          value={maxUsageCount}
          errorText={
            isMaxUsageCountValid
              ? undefined
              : "You must provide a maximum usage count."
          }
          type="number"
          onChange={this.handleMaxUsageCountChange}
        />
      </Dialog>
    );
  }
}

AddDomainDialog.propTypes = {
  open: PropTypes.bool,
  onRequestClose: PropTypes.func,
  onAddNewDomain: PropTypes.func
};

export default AddDomainDialog;
