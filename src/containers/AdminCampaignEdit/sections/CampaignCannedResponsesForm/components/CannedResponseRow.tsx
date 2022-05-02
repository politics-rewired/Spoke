import CreateIcon from "@material-ui/icons/Create";
import DeleteIcon from "@material-ui/icons/Delete";
import IconButton from "material-ui/IconButton";
import React from "react";

import { CannedResponse } from "../../../../../api/canned-response";
import { LargeListItem } from "../../../../../components/LargeList";
import { dataTest } from "../../../../../lib/attributes";

interface Props {
  cannedResponse: CannedResponse;
  onDelete(): void;
  onToggleResponseEditor(): void;
}

export const CannedResponseRow: React.SFC<Props> = ({
  cannedResponse,
  onDelete,
  onToggleResponseEditor
}) => {
  const actionMenu = (
    <div>
      <IconButton onClick={onToggleResponseEditor}>
        <CreateIcon />
      </IconButton>
      <IconButton onClick={onDelete}>
        <DeleteIcon />
      </IconButton>
    </div>
  );

  return (
    <LargeListItem
      {...dataTest("cannedResponse")}
      key={cannedResponse.id}
      primaryText={cannedResponse.title}
      secondaryText={cannedResponse.text}
      rightActionMenu={actionMenu}
    />
  );
};

export default CannedResponseRow;
