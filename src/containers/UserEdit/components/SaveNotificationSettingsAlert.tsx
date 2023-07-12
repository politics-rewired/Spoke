import IconButton from "@material-ui/core/IconButton";
import Snackbar from "@material-ui/core/Snackbar";
import CloseIcon from "@material-ui/icons/Close";
import MuiAlert from "@material-ui/lab/Alert";
import React from "react";

import { NotificationFrequencyType } from "../../../api/user";
import { titleCase } from "../../../lib/attributes";

export interface SaveNotificationSettingsAlertProps {
  open: boolean;
  notificationFrequency: NotificationFrequencyType;
  handleCloseSnackbar: () => void;
}

export const SaveNotificationSettingsAlert: React.FC<SaveNotificationSettingsAlertProps> = (
  props
) => {
  const getSnackbarText = () => {
    switch (props.notificationFrequency) {
      case NotificationFrequencyType.All:
        return (
          <p>
            Emails will be sent for all notifications, including assignment
            changes and replies.
          </p>
        );
      case NotificationFrequencyType.Daily:
        return (
          <p>
            Email notifications are sent at 9AM in the time zone of your Spoke
            workspace.
          </p>
        );
      case NotificationFrequencyType.Periodic:
        return (
          <p>
            Email notifications are sent at 9AM, 1PM, 4PM, and 8PM in the time
            zone of your Spoke workspace.
          </p>
        );
      case NotificationFrequencyType.None:
        return (
          <p>
            You will not receive notifications about changes to your
            assignments, or replies.
          </p>
        );
      default:
        return <p />;
    }
  };
  return (
    <Snackbar
      anchorOrigin={{
        vertical: "top",
        horizontal: "right"
      }}
      open={props.open}
      autoHideDuration={6000}
      onClose={props.handleCloseSnackbar}
      action={
        <IconButton
          size="small"
          aria-label="close"
          color="inherit"
          onClick={props.handleCloseSnackbar}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      }
    >
      <MuiAlert variant="filled" elevation={6} severity="success">
        Changes Saved!
        <h3>{titleCase(props.notificationFrequency)}</h3>
        {getSnackbarText()}
      </MuiAlert>
    </Snackbar>
  );
};
