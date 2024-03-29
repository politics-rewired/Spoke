import Button from "@material-ui/core/Button";
import Chip from "@material-ui/core/Chip";
import TableCell from "@material-ui/core/TableCell";
import TableRow from "@material-ui/core/TableRow";
import MoreIcon from "@material-ui/icons/ArrowForward";
import PauseIcon from "@material-ui/icons/Pause";
import PlayIcon from "@material-ui/icons/PlayArrow";
import type { AutosendingTargetFragment } from "@spoke/spoke-codegen";
import React from "react";
import { Link } from "react-router-dom";

import AutosendingLimitField from "./AutosendingLimitField";
import useChipStyles from "./chipStyles";

interface AutosendingTargetRowProps {
  target: AutosendingTargetFragment;
  organizationId: string;
  disabled?: boolean;
  onStart: () => Promise<unknown> | unknown;
  onPause: () => Promise<unknown> | unknown;
}

export const AutosendingTargetRow: React.FC<AutosendingTargetRowProps> = (
  props
) => {
  const { target, organizationId, disabled = false, onStart, onPause } = props;
  const chipClasses = useChipStyles();
  const statusChipDisplay = target.autosendStatus;

  const chipRootClass =
    statusChipDisplay === "sending"
      ? chipClasses.sending
      : statusChipDisplay === "paused"
      ? chipClasses.paused
      : statusChipDisplay === "complete"
      ? chipClasses.complete
      : chipClasses.unstarted;

  return (
    <TableRow>
      <TableCell>
        {target.id}: {target.title}
      </TableCell>
      <TableCell>
        <Chip label={statusChipDisplay} classes={{ root: chipRootClass }} />
      </TableCell>
      <TableCell>
        <AutosendingLimitField campaignId={target.id} />
      </TableCell>
      <TableCell>
        {target.autosendStatus ===
        "complete" ? undefined : target.autosendStatus === "sending" ||
          target.autosendStatus === "holding" ? (
          <Button
            variant="contained"
            startIcon={<PauseIcon />}
            disabled={disabled}
            onClick={onPause}
          >
            Pause
          </Button>
        ) : (
          <Button
            variant="contained"
            startIcon={<PlayIcon />}
            disabled={disabled}
            onClick={onStart}
          >
            {target.autosendStatus === "unstarted" ? "Queue" : "Resume"}
          </Button>
        )}
      </TableCell>
      <TableCell>
        <Link to={`/admin/${organizationId}/campaigns/${target.id}`}>
          <MoreIcon />
        </Link>
      </TableCell>
    </TableRow>
  );
};

export default AutosendingTargetRow;
