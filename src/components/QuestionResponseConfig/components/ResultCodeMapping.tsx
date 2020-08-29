import React from "react";

import { ListItem } from "material-ui/List";
import IconButton from "material-ui/IconButton";
import InputIcon from "material-ui/svg-icons/action/input";
import DeleteIcon from "material-ui/svg-icons/action/delete";

import { ExternalResultCode } from "../../../api/external-result-code";

interface Props {
  resultCode: ExternalResultCode;
}

export const ResultCodeMapping: React.SFC<Props> = props => {
  return (
    <ListItem
      primaryText={props.resultCode.name}
      leftIcon={<InputIcon />}
      rightIconButton={
        <IconButton>
          <DeleteIcon />
        </IconButton>
      }
    />
  );
};
