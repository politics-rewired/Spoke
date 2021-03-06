import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import { ApolloQueryResult } from "apollo-client";
import gql from "graphql-tag";
import FlatButton from "material-ui/FlatButton";
import RaisedButton from "material-ui/RaisedButton";
import React, { Component } from "react";

import { CampaignContact } from "../../../api/campaign-contact";
import { ContactActionInput } from "../../../api/types";
import {
  formatErrorMessage,
  withOperations
} from "../../../containers/hoc/with-operations";
import { MutationMap } from "../../../network/types";

interface InnerProps {
  contact: CampaignContact;
  isOptedOut: boolean;
  optOutChanged(value: boolean): void;
}

interface HocProps {
  mutations: {
    createOptOut(
      optOut: ContactActionInput,
      campaignContactId: string
    ): ApolloQueryResult<any>;
    removeOptOut(cell: string): ApolloQueryResult<any>;
  };
}

interface Props extends InnerProps, HocProps {}

interface State {
  isMakingRequest: boolean;
  dialogTitle: string;
  dialogText: string;
  dialogActions: React.ReactElement<any>[];
}

class MessageOptOut extends Component<Props, State> {
  constructor(props: Props) {
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
        key="cancel"
        label="Cancel"
        primary
        onClick={this.handleCloseAlert}
      />,
      <FlatButton
        key="submit"
        label="Submit"
        primary
        keyboardFocused
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
    const { contact } = this.props;
    const { cell } = contact;

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
          key="close"
          label="Close"
          primary
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
          key="close"
          label="Close"
          primary
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
          <p style={{ flexGrow: 1 }}>
            {isOptedOut
              ? "This user has been opted out. Would you like to opt them back in?"
              : ""}
          </p>
          <div style={{ flexShrink: 1 }}>
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
                secondary
                disabled={this.state.isMakingRequest}
                onClick={this.handleClickOptOut}
              />
            )}
          </div>
        </div>
        <Dialog open={!!dialogTitle} onClose={this.handleCloseAlert}>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogContent>
            <DialogContentText>{dialogText}</DialogContentText>
          </DialogContent>
          <DialogActions>{dialogActions}</DialogActions>
        </Dialog>
      </div>
    );
  }
}

const mutations: MutationMap<Props> = {
  createOptOut: () => (
    optOut: ContactActionInput,
    campaignContactId: string
  ) => ({
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
  removeOptOut: () => (cell: string) => ({
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
