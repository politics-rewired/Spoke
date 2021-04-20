import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import FlatButton from "material-ui/FlatButton";
import React from "react";

import { eventBus, EventTypes } from "./events";

export default class VersionNotifier extends React.Component {
  state = {
    isDismissed: false,
    newServerVersion: undefined
  };

  componentDidMount() {
    eventBus.on(EventTypes.NewSpokeVersionAvailble, this.handleNewVersion);
  }

  componentWillUnmount() {
    eventBus.removeListener(this.handleNewVersion);
  }

  handleNewVersion = (newServerVersion) => this.setState({ newServerVersion });

  handleClose = () => this.setState({ isDismissed: true });

  handleRefreshNow = () => window.location.reload();

  render() {
    const { isDismissed, newServerVersion } = this.state;
    const isOpen = !isDismissed && newServerVersion !== undefined;

    const actions = [
      <FlatButton
        key="later"
        label="Refresh Later"
        primary
        onClick={this.handleClose}
      />,
      <FlatButton
        key="now"
        label="Refresh Now"
        primary
        keyboardFocused
        onClick={this.handleRefreshNow}
      />
    ];

    return (
      <Dialog modal open={isOpen} onClose={this.handleClose}>
        <DialogTitle>New Spoke Version Available</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Spoke {newServerVersion || "n/a"} is available! To get the update,
            you will need to refresh the page. Some features may not work until
            you load the new version
          </DialogContentText>
        </DialogContent>
        <DialogActions>{actions}</DialogActions>
      </Dialog>
    );
  }
}
