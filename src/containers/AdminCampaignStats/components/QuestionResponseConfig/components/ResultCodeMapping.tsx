import { green } from "@material-ui/core/colors";
import IconButton from "@material-ui/core/IconButton";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import DeleteIcon from "@material-ui/icons/Delete";
import InputIcon from "@material-ui/icons/Input";
import type { ExternalResultCode } from "@spoke/spoke-codegen";
import React from "react";

interface Props {
  resultCode: ExternalResultCode;
  warning?: string;
  onClickDelete(): void;
}

export const ResultCodeMapping: React.FC<Props> = (props) => {
  return (
    <ListItem>
      <ListItemIcon>
        <InputIcon style={{ color: green[200] }} />
      </ListItemIcon>
      <ListItemText primary={props.resultCode.name} secondary={props.warning} />
      <ListItemSecondaryAction>
        <IconButton onClick={props.onClickDelete}>
          <DeleteIcon />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );
};

export default ResultCodeMapping;
