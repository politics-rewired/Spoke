import type { Theme } from "@material-ui/core";
import { makeStyles } from "@material-ui/core";
import Badge from "@material-ui/core/Badge";
import Button from "@material-ui/core/Button";
import React from "react";

import { dataTest } from "../lib/attributes";
import theme from "../styles/theme";

export interface BadgeButtonProps {
  title: string;
  badgeCount: number;
  hideIfZero?: boolean;
  dataTestText?: string;
  primary?: boolean;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<unknown>;
  color?: string;
}

const useStyles = makeStyles<Theme, BadgeButtonProps>({
  badge: {
    backgroundColor: (props) => props.color ?? theme.colors.yellow
  }
});

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
        variant="contained"
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
