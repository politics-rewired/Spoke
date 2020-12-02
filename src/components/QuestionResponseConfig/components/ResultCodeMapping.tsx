import IconButton from "material-ui/IconButton";
import { ListItem } from "material-ui/List";
import { green200 } from "material-ui/styles/colors";
import DeleteIcon from "material-ui/svg-icons/action/delete";
import InputIcon from "material-ui/svg-icons/action/input";
import React from "react";

import { ExternalResultCode } from "../../../api/external-result-code";

interface Props {
  resultCode: ExternalResultCode;
  onClickDelete(): void;
}

export const ResultCodeMapping: React.SFC<Props> = (props) => {
  return (
    <ListItem
      primaryText={props.resultCode.name}
      leftIcon={<InputIcon color={green200} />}
      rightIconButton={
        <IconButton onClick={props.onClickDelete}>
          <DeleteIcon />
        </IconButton>
      }
    />
  );
};

export default ResultCodeMapping;
