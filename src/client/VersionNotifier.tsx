import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import React, { useCallback, useEffect, useState } from "react";

import { eventBus, EventTypes } from "./events";

export const VersionNotifier: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [newServerVersion, setNewServerVersion] = useState<string | undefined>(
    undefined
  );

  const handleNewVersion = useCallback(
    (version: string) => setNewServerVersion(version),
    [setNewServerVersion]
  );

  useEffect(() => {
    eventBus.on(EventTypes.NewSpokeVersionAvailble, handleNewVersion);
    return () => {
      eventBus.removeListener(
        EventTypes.NewSpokeVersionAvailble,
        handleNewVersion
      );
    };
  }, [handleNewVersion]);

  const handleClose = () => setIsDismissed(true);

  const handleRefreshNow = () => window.location.reload();

  const isOpen = !isDismissed && newServerVersion !== undefined;

  return (
    <Dialog open={isOpen} onClose={handleClose}>
      <DialogTitle>New Spoke Version Available</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Spoke {newServerVersion || "n/a"} is available! To get the update, you
          will need to refresh the page. Some features may not work until you
          load the new version
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button color="primary" onClick={handleClose}>
          Refresh Later
        </Button>
        <Button autoFocus onClick={handleRefreshNow}>
          Refresh Now
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VersionNotifier;
