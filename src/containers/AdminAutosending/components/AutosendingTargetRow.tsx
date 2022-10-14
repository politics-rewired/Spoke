import Button from "@material-ui/core/Button";
import Chip from "@material-ui/core/Chip";
import red from "@material-ui/core/colors/red";
import TableCell from "@material-ui/core/TableCell";
import TableRow from "@material-ui/core/TableRow";
import TextField from "@material-ui/core/TextField";
import MoreIcon from "@material-ui/icons/ArrowForward";
import PauseIcon from "@material-ui/icons/Pause";
import PlayIcon from "@material-ui/icons/PlayArrow";
import type { AutosendingTargetFragment } from "@spoke/spoke-codegen";
import React from "react";
import { Link } from "react-router-dom";

import useChipStyles from "./chipStyles";
import { convertValueToLimit } from "./utils";

interface AutosendingTargetRowProps {
  target: AutosendingTargetFragment;
  organizationId: string;
  disabled?: boolean;
  onStart: () => Promise<unknown> | unknown;
  onPause: () => Promise<unknown> | unknown;
  onLimitChange: (inputLimit: number | null) => Promise<unknown> | unknown;
}

export const AutosendingTargetRow: React.FC<AutosendingTargetRowProps> = (
  props
) => {
  const {
    target,
    organizationId,
    disabled = false,
    onStart,
    onPause,
    onLimitChange
  } = props;

  const chipClasses = useChipStyles();
  const totalSent = target.stats?.countMessagedContacts;
  const statusChipDisplay = target.autosendStatus;

  const chipRootClass =
    statusChipDisplay === "sending"
      ? chipClasses.sending
      : statusChipDisplay === "paused"
      ? chipClasses.paused
      : statusChipDisplay === "complete"
      ? chipClasses.complete
      : chipClasses.unstarted;

  const hasHighUnhandledReplies =
    target.stats?.percentUnhandledReplies !== undefined &&
    target.stats.percentUnhandledReplies > 25;
  const repliesColor = hasHighUnhandledReplies ? red[600] : "black";

  const waitingToDeliver =
    target.deliverabilityStats.sendingCount +
    target.deliverabilityStats.sentCount;

  return (
    <TableRow>
      <TableCell>
        {target.id}: {target.title}
      </TableCell>
      <TableCell>
        <Chip label={statusChipDisplay} classes={{ root: chipRootClass }} />
      </TableCell>
      <TableCell>
        <TextField
          type="number"
          value={target.autosendLimit}
          onChange={(event) =>
            onLimitChange(convertValueToLimit(event.target.value))
          }
          style={{ width: "80px" }}
        />
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
      <TableCell>{target.contactsCount}</TableCell>
      <TableCell>94</TableCell>
      <TableCell>{target.deliverabilityStats.deliveredCount}</TableCell>
      <TableCell>
        {target.contactsCount! -
          totalSent! -
          (target.stats?.needsMessageOptOutsCount || 0)}
      </TableCell>
      <TableCell>{waitingToDeliver}</TableCell>
      <TableCell>{target.deliverabilityStats.errorCount}</TableCell>
      <TableCell>
        <span style={{ color: repliesColor }}>
          {target.stats?.receivedMessagesCount}
        </span>
      </TableCell>
      <TableCell>{target.stats?.optOutsCount}</TableCell>
      <TableCell>
        <Link to={`/admin/${organizationId}/campaigns/${target.id}`}>
          <MoreIcon />
        </Link>
      </TableCell>
    </TableRow>
  );
};

export default AutosendingTargetRow;
