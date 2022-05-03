import { green, orange } from "@material-ui/core/colors";
import DeleteIcon from "@material-ui/icons/Delete";
import LocalActivityIcon from "@material-ui/icons/LocalActivity";
import IconButton from "material-ui/IconButton";
import { ListItem } from "material-ui/List";
import React from "react";

import { ExternalActivistCode } from "../../../api/external-activist-code";
import { ExternalDataCollectionStatus } from "../../../api/types";

interface Props {
  activistCode: ExternalActivistCode;
  onClickDelete(): void;
}

export const ActivistCodeMapping: React.SFC<Props> = (props) => {
  const isActive =
    props.activistCode.status === ExternalDataCollectionStatus.ACTIVE;

  return (
    <ListItem
      primaryText={props.activistCode.name}
      secondaryText={props.activistCode.type}
      leftIcon={
        <LocalActivityIcon
          style={{ color: isActive ? green[200] : orange[200] }}
        />
      }
      rightIconButton={
        <IconButton onClick={props.onClickDelete}>
          <DeleteIcon />
        </IconButton>
      }
    />
  );
};

export default ActivistCodeMapping;
