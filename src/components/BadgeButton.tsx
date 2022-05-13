import Button from "@material-ui/core/Button";
import Badge from "material-ui/Badge";
import React from "react";

import { dataTest } from "../lib/attributes";

const inlineStyles = {
  badge: {
    fontSize: 12,
    top: 20,
    right: 20,
    padding: "4px 2px 0px 2px",
    width: 20,
    textAlign: "center",
    verticalAlign: "middle",
    height: 20
  }
};

export interface BadgeButtonProps {
  title: string;
  badgeCount: number;
  hideIfZero?: boolean;
  dataTestText?: string;
  primary?: boolean;
  disabled?: boolean;
  style?: any;
  onClick?: React.MouseEventHandler<unknown>;
}

export const BadgeButton: React.FC<BadgeButtonProps> = (props) => {
  if (props.badgeCount === 0 && props.hideIfZero) {
    return null;
  }

  if (props.badgeCount === 0) {
    return (
      <Button
        {...dataTest(props.dataTestText)}
        variant="contained"
        disabled={props.disabled}
        color={props.primary && !props.disabled ? "primary" : "default"}
        onClick={props.onClick}
      >
        {props.title}
      </Button>
    );
  }

  return (
    <Badge
      key={props.title}
      badgeStyle={{ ...inlineStyles.badge, ...(props.style || {}) }}
      badgeContent={props.badgeCount || ""}
      primary={props.primary && !props.disabled}
      secondary={!props.primary && !props.disabled}
    >
      <Button
        {...dataTest(props.dataTestText)}
        variant="contained"
        disabled={props.disabled}
        onClick={props.onClick}
      >
        {props.title}
      </Button>
    </Badge>
  );
};

export default BadgeButton;
