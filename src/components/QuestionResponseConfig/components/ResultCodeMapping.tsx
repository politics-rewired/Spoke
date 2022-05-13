import { green } from "@material-ui/core/colors";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
import InputIcon from "@material-ui/icons/Input";
import { ListItem } from "material-ui/List";
import React from "react";

import { ExternalResultCode } from "../../../api/external-result-code";

interface Props {
  resultCode: ExternalResultCode;
  warning?: string;
  onClickDelete(): void;
}

export const ResultCodeMapping: React.FC<Props> = (props) => {
  return (
    <ListItem
      primaryText={props.resultCode.name}
      secondaryText={props.warning}
      leftIcon={<InputIcon style={{ color: green[200] }} />}
      rightIconButton={
        <IconButton onClick={props.onClickDelete}>
          <DeleteIcon />
        </IconButton>
      }
    />
  );
};

export default ResultCodeMapping;
