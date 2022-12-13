import type { Theme } from "@material-ui/core";
import { makeStyles } from "@material-ui/core";
import Badge from "@material-ui/core/Badge";
import Button from "@material-ui/core/Button";
import React from "react";

import { dataTest } from "../../../lib/attributes";

export type MessageType = "initial" | "reply" | "past";

export interface BadgeButtonProps {
  title: string;
  badgeCount: number;
  hideIfZero?: boolean;
  dataTestText?: string;
  primary?: boolean;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<unknown>;
  type?: MessageType;
}

const badgeColor = (messageType: MessageType, theme: Theme) =>
  messageType === "initial"
    ? theme.palette.success.light
    : messageType === "reply"
    ? theme.palette.error.light
    : theme.palette.convoMessageBadge!.main;

const useStyles = makeStyles<Theme, BadgeButtonProps>((theme) => ({
  badge: {
    backgroundColor: ({ type: messageType = "past" }) =>
      badgeColor(messageType, theme),
    color: ({ type: messageType = "past" }) =>
      theme.palette.getContrastText(badgeColor(messageType, theme))
  }
}));

export const BadgeButton: React.FC<BadgeButtonProps> = (props) => {
  const classes = useStyles(props);

  if (props.badgeCount === 0 && props.hideIfZero) {
    return null;
  }

  const buttonColor = props.disabled
    ? "default"
    : props.primary
    ? "primary"
    : "secondary";

  if (props.badgeCount === 0) {
    return (
      <Button
        {...dataTest(props.dataTestText)}
        variant="contained"
        disabled={props.disabled}
        color={buttonColor}
        onClick={props.onClick}
      >
        {props.title}
      </Button>
    );
  }

  return (
    <Badge
      key={props.title}
      badgeContent={props.badgeCount || ""}
      classes={{ badge: classes.badge }}
    >
      <Button
        {...dataTest(props.dataTestText)}
        variant="outlined"
        disabled={props.disabled}
        color={buttonColor}
        onClick={props.onClick}
      >
        {props.title}
      </Button>
    </Badge>
  );
};

export default BadgeButton;
