import React from "react";

import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";

import { eventBus, EventTypes } from "./events";

export default class VersionNotifier extends React.Component {
  state = {
    isDismissed: false,
    serverVersion: undefined
  };

  handleNewVersion = serverVersion => this.setState({ serverVersion });

  componentDidMount() {
    eventBus.on(EventTypes.NewSpokeVersionAvailble, this.handleNewVersion);
  }

  componentWillUnmount() {
    eventBus.removeListener(this.handleNewVersion);
  }

  handleClose = () => this.setState({ isDismissed: true });

  handleRefreshNow = () => window.location.reload();

  render() {
    const { isDismissed, serverVersion } = this.state;
    const clientVersion = window.SPOKE_VERSION;
    const isOpen =
      !isDismissed && !!serverVersion && clientVersion !== serverVersion;

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
        modal={false}
        open={isOpen}
        onRequestClose={this.handleClose}
      >
        {serverVersion &&
          `Spoke ${serverVersion} is available! To get the update, you will need to refresh the page. ` +
            `Some features may not work until you load the new version`}
      </Dialog>
    );
  }
}
