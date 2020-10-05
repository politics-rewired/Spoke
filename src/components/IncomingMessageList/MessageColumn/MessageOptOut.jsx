import React, { Component } from "react";
import PropTypes from "prop-types";
import gql from "graphql-tag";

import FlatButton from "material-ui/FlatButton";
import RaisedButton from "material-ui/RaisedButton";
import Dialog from "material-ui/Dialog";

import {
  formatErrorMessage,
  withOperations
} from "../../../containers/hoc/with-operations";

class MessageOptOut extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isMakingRequest: false,
      dialogTitle: "",
      dialogText: "",
      dialogActions: []
    };
  }

  handleCloseAlert = () => {
    this.setState({
      dialogTitle: "",
      dialogText: "",
      dialogActions: []
    });
  };

  openOptInConfirmation = () => {
    const dialogText =
      "Are you sure you would like to opt this contact back in? " +
      "This will mean they can receive texts from all campaigns.";
    const dialogActions = [
      <FlatButton
        label="Cancel"
        primary={true}
        onClick={this.handleCloseAlert}
      />,
      <FlatButton
        label="Submit"
        primary={true}
        keyboardFocused={true}
        onClick={this.handleClickOptIn}
      />
    ];
    this.setState({
      dialogTitle: "Confirm Opt-In",
      dialogText,
      dialogActions
    });
  };

  handleClickOptIn = async () => {
    const { contact } = this.props,
      { cell } = contact;

    this.setState({ isMakingRequest: true });

    try {
      const response = await this.props.mutations.removeOptOut(cell);
      if (response.errors) {
        throw response.errors;
      }
      this.props.optOutChanged(false);
      this.handleCloseAlert();
    } catch (error) {
      const dialogActions = [
        <FlatButton
          label="Close"
          primary={true}
          onClick={this.handleCloseAlert}
        />
      ];
      this.setState({
        dialogTitle: "Error Submitting",
        dialogText: formatErrorMessage(error.message),
        dialogActions
      });
    } finally {
      this.setState({ isMakingRequest: false });
    }
  };

  handleClickOptOut = async () => {
    const { contact } = this.props;
    this.setState({ isMakingRequest: true });

    try {
      const optOut = {
        cell: contact.cell,
        assignmentId: contact.assignmentId
      };
      const response = await this.props.mutations.createOptOut(
        optOut,
        contact.id
      );
      if (response.errors) {
        throw response.errors;
      }
      this.props.optOutChanged(true);
    } catch (error) {
      const dialogActions = [
        <FlatButton
          label="Close"
          primary={true}
          onClick={this.handleCloseAlert}
        />
      ];
      this.setState({
        dialogTitle: "Error Opting Out",
        dialogText: formatErrorMessage(error.message),
        dialogActions
      });
    } finally {
      this.setState({ isMakingRequest: false });
    }
  };

  render() {
    const { isOptedOut } = this.props;
    const { dialogTitle, dialogText, dialogActions } = this.state;

    return (
      <div>
        <div style={{ display: "flex" }}>
          <p style={{ flexGrow: "1" }}>
            {isOptedOut
              ? "This user has been opted out. Would you like to opt them back in?"
              : ""}
          </p>
          <div style={{ flexShrink: "1" }}>
            {isOptedOut && (
              <RaisedButton
                label="Opt-In"
                backgroundColor="#ff0033"
                disabled={this.state.isMakingRequest}
                onClick={this.openOptInConfirmation}
                style={{ float: "right" }}
              />
            )}
            {!isOptedOut && (
              <RaisedButton
                label="Opt-Out"
                secondary={true}
                disabled={this.state.isMakingRequest}
                onClick={this.handleClickOptOut}
              />
            )}
          </div>
        </div>
        <Dialog
          title={dialogTitle}
          actions={dialogActions}
          modal={false}
          open={!!dialogTitle}
          onRequestClose={this.handleCloseAlert}
        >
          {dialogText}
        </Dialog>
      </div>
    );
  }
}

MessageOptOut.propTypes = {
  contact: PropTypes.object,
  isOptedOut: PropTypes.bool,
  optOutChanged: PropTypes.func
};

const mutations = {
  createOptOut: ownProps => (optOut, campaignContactId) => ({
    mutation: gql`
      mutation createOptOut(
        $optOut: ContactActionInput!
        $campaignContactId: String!
      ) {
        createOptOut(optOut: $optOut, campaignContactId: $campaignContactId) {
          id
          optOut {
            cell
          }
        }
      }
    `,
    variables: {
      optOut,
      campaignContactId
    }
  }),
  removeOptOut: ownProps => cell => ({
    mutation: gql`
      mutation removeOptOut($cell: Phone!) {
        removeOptOut(cell: $cell) {
          id
          optOut {
            cell
          }
        }
      }
    `,
    variables: { cell }
  })
};

export default withOperations({
  mutations
})(MessageOptOut);
