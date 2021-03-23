import Badge from "material-ui/Badge";
import RaisedButton from "material-ui/RaisedButton";
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
      <RaisedButton
        {...dataTest(props.dataTestText)}
        disabled={props.disabled}
        label={props.title}
        primary={props.primary && !props.disabled}
        onClick={props.onClick}
      />
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
      <RaisedButton
        {...dataTest(props.dataTestText)}
        disabled={props.disabled}
        label={props.title}
        onClick={props.onClick}
      />
    </Badge>
  );
};

export default BadgeButton;
