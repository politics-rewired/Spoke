import Badge from "@material-ui/core/Badge";
import Button from "@material-ui/core/Button";
import React from "react";

import { dataTest } from "../lib/attributes";

export interface BadgeButtonProps {
  title: string;
  badgeCount: number;
  hideIfZero?: boolean;
  dataTestText?: string;
  primary?: boolean;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<unknown>;
}

export const BadgeButton: React.FC<BadgeButtonProps> = (props) => {
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
      color="error"
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
