import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import TextField from "material-ui/TextField";
import PropTypes from "prop-types";
import React, { Component } from "react";

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
      <Button key="close" onClick={onRequestClose}>
        Close
      </Button>,
      <Button
        key="add"
        variant="contained"
        color="primary"
        disabled={isSubmitDisabled}
        onClick={this.handleAddDomainClick}
      >
        Add
      </Button>
    ];

    return (
      <Dialog open={open} onClose={onRequestClose}>
        <DialogTitle>Add Domain</DialogTitle>
        <DialogContent>
          <DialogContentText>Add a new shortlink domain.</DialogContentText>

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
        </DialogContent>
        <DialogActions>{actions}</DialogActions>
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
