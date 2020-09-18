import React from "react";

import { ListItem } from "material-ui/List";
import IconButton from "material-ui/IconButton";
import LocalActivityIcon from "material-ui/svg-icons/maps/local-activity";
import DeleteIcon from "material-ui/svg-icons/action/delete";
import { green200, orange200 } from "material-ui/styles/colors";

import { ExternalActivistCode } from "../../../api/external-activist-code";
import { ExternalDataCollectionStatus } from "../../../api/types";

interface Props {
  activistCode: ExternalActivistCode;
  onClickDelete(): void;
}

export const ActivistCodeMapping: React.SFC<Props> = props => {
  const isActive =
    props.activistCode.status === ExternalDataCollectionStatus.ACTIVE;

  return (
    <ListItem
      primaryText={props.activistCode.name}
      secondaryText={props.activistCode.type}
      leftIcon={<LocalActivityIcon color={isActive ? green200 : orange200} />}
      rightIconButton={
        <IconButton onClick={props.onClickDelete}>
          <DeleteIcon />
        </IconButton>
      }
    />
  );
};
