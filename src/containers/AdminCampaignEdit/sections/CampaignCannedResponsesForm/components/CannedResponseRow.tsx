import IconButton from "material-ui/IconButton";
import DeleteIcon from "material-ui/svg-icons/action/delete";
import React from "react";

import { CannedResponse } from "../../../../../api/canned-response";
import { LargeListItem } from "../../../../../components/LargeList";
import { dataTest } from "../../../../../lib/attributes";

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
