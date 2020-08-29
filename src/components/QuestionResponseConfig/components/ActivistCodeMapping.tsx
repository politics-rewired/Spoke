import React from "react";

import { ListItem } from "material-ui/List";
import IconButton from "material-ui/IconButton";
import LocalActivityIcon from "material-ui/svg-icons/maps/local-activity";
import DeleteIcon from "material-ui/svg-icons/action/delete";

import { ExternalActivistCode } from "../../../api/external-activist-code";

interface Props {
  activistCode: ExternalActivistCode;
  onClickDelete(): void;
}

export const ActivistCodeMapping: React.SFC<Props> = props => {
  return (
    <ListItem
      primaryText={props.activistCode.name}
      secondaryText={props.activistCode.type}
      leftIcon={<LocalActivityIcon />}
      rightIconButton={
        <IconButton onClick={props.onClickDelete}>
          <DeleteIcon />
        </IconButton>
      }
    />
  );
};
