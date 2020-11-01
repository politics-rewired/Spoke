import React from "react";

import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";

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
        label="Refresh Later"
        primary={true}
        onClick={this.handleClose}
      />,
      <FlatButton
        label="Refresh Now"
        primary={true}
        keyboardFocused={true}
        onClick={this.handleRefreshNow}
      />
    ];

    return (
      <Dialog
        title="New Spoke Version Available"
        actions={actions}
        modal={true}
        open={isOpen}
        onRequestClose={this.handleClose}
      >
        Spoke {newServerVersion || "n/a"} is available! To get the update, you
        will need to refresh the page. Some features may not work until you load
        the new version
      </Dialog>
    );
  }
}
