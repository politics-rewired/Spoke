import React from "react";

import IconButton from "material-ui/IconButton";
import DeleteIcon from "material-ui/svg-icons/action/delete";

import { CannedResponse } from "../../../../../api/canned-response";
import { dataTest } from "../../../../../lib/attributes";
import { LargeListItem } from "../../../../../components/LargeList";

interface Props {
  cannedResponse: CannedResponse;
  onDelete(): void;
}

export const CannedResponseRow: React.SFC<Props> = ({
  cannedResponse,
  onDelete
}) => (
  <LargeListItem
    {...dataTest("cannedResponse")}
    key={cannedResponse.id}
    primaryText={cannedResponse.title}
    secondaryText={cannedResponse.text}
    rightIconButton={
      <IconButton onClick={onDelete}>
        <DeleteIcon />
      </IconButton>
    }
  />
);

export default CannedResponseRow;
