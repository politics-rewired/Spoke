import type { ApolloQueryResult } from "@apollo/client";
import { gql } from "@apollo/client";
import Button from "@material-ui/core/Button";
import { deepOrange } from "@material-ui/core/colors";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import React, { Component } from "react";

import type { CampaignContact } from "../../../../../api/campaign-contact";
import type { ContactActionInput } from "../../../../../api/types";
import ColorButton from "../../../../../components/ColorButton";
import type { MutationMap } from "../../../../../network/types";
import {
  formatErrorMessage,
  withOperations
} from "../../../../hoc/with-operations";

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
      <Button key="cancel" color="primary" onClick={this.handleCloseAlert}>
        Cancel
      </Button>,
      <Button key="submit" color="primary" onClick={this.handleClickOptIn}>
        Submit
      </Button>
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
        <Button key="close" color="primary" onClick={this.handleCloseAlert}>
          Close
        </Button>
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
        <Button key="close" color="primary" onClick={this.handleCloseAlert}>
          Close
        </Button>
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
              <ColorButton
                variant="contained"
                style={{ float: "right" }}
                backgroundColor="#ff0033"
                disabled={this.state.isMakingRequest}
                onClick={this.openOptInConfirmation}
              >
                Opt-In
              </ColorButton>
            )}
            {!isOptedOut && (
              <ColorButton
                variant="contained"
                backgroundColor={deepOrange[500]}
                disabled={this.state.isMakingRequest}
                onClick={this.handleClickOptOut}
              >
                Opt-Out
              </ColorButton>
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
