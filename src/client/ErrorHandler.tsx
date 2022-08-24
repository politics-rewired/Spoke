import Snackbar from "@material-ui/core/Snackbar";
import Alert from "@material-ui/lab/Alert";
import React, { useEffect, useRef, useState } from "react";

import { eventBus, EventTypes } from "./events";

const ErrorHandler: React.FC = () => {
  const errorCount = useRef(0);
  const [open, setOpen] = useState<boolean>(false);

  const handleNewEvent = () => {
    errorCount.current += 1;

    // We have our first event triggered
    if (errorCount.current === 1) {
      // Set timeout to expire count after 30 seconds
      // so a few events over a long period of time
      // don't set off the snackbar
      setTimeout(() => {
        errorCount.current = 0;
      }, 30 * 1000);
    }

    // Show the snackbar, and reset the count to 0
    if (errorCount.current > 3) {
      setOpen(true);
      errorCount.current = 0;
    }
  };

  const handleClose = () => setOpen(false);

  useEffect(() => {
    eventBus.on(EventTypes.GraphQLServerError, handleNewEvent);
  }, []);

  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
    >
      <Alert
        onClose={handleClose}
        severity="error"
        style={{ fontSize: "1.3em" }}
      >
        We're having issues communicating with the server. If issues persist,
        please wait a minute, refresh, and try again!
      </Alert>
    </Snackbar>
  );
};

export default ErrorHandler;
