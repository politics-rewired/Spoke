import { green, orange } from "@material-ui/core/colors";
import IconButton from "@material-ui/core/IconButton";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import DeleteIcon from "@material-ui/icons/Delete";
import LocalActivityIcon from "@material-ui/icons/LocalActivity";
import type { ExternalActivistCode } from "@spoke/spoke-codegen";
import React from "react";

import { ExternalDataCollectionStatus } from "../../../../../api/types";

interface Props {
  activistCode: ExternalActivistCode;
  onClickDelete(): void;
}

export const ActivistCodeMapping: React.SFC<Props> = (props) => {
  const isActive =
    props.activistCode.status === ExternalDataCollectionStatus.ACTIVE;

  return (
    <ListItem>
      <ListItemIcon>
        <LocalActivityIcon
          style={{ color: isActive ? green[200] : orange[200] }}
        />
      </ListItemIcon>
      <ListItemText
        primary={props.activistCode.name}
        secondary={props.activistCode.type}
      />
      <ListItemSecondaryAction>
        <IconButton onClick={props.onClickDelete}>
          <DeleteIcon />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );
};

export default ActivistCodeMapping;
