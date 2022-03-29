import Button from "@material-ui/core/Button";
import Chip from "@material-ui/core/Chip";
import green from "@material-ui/core/colors/green";
import grey from "@material-ui/core/colors/grey";
import red from "@material-ui/core/colors/red";
import { makeStyles } from "@material-ui/core/styles";
import TableCell from "@material-ui/core/TableCell";
import TableRow from "@material-ui/core/TableRow";
import MoreIcon from "@material-ui/icons/ArrowForward";
import PauseIcon from "@material-ui/icons/Pause";
import PlayIcon from "@material-ui/icons/PlayArrow";
import { AutosendingTargetFragment } from "@spoke/spoke-codegen";
import React from "react";
import { Link } from "react-router-dom";

const useStyles = makeStyles({
  unstarted: {
    backgroundColor: grey[200]
  },
  sending: {
    backgroundColor: green[400]
  },
  paused: {
    backgroundColor: red[200]
  },
  complete: {
    backgroundColor: green[100]
  }
});

interface AutosendingTargetRowProps {
  target: AutosendingTargetFragment;
  organizationId: string;
  disabled?: boolean;
  onStart?: () => Promise<unknown> | unknown;
  onPause?: () => Promise<unknown> | unknown;
}

export const AutosendingTargetRow: React.FC<AutosendingTargetRowProps> = (
  props
) => {
  const { target, organizationId, disabled = false, onStart, onPause } = props;

  const chipClasses = useStyles();

  const totalSent = target.stats?.countMessagedContacts;

  const statusChipDisplay =
    target.autosendStatus === "sending"
      ? totalSent === 0
        ? "up next"
        : target.autosendStatus
      : target.autosendStatus;

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
        {target.autosendStatus ===
        "complete" ? undefined : target.autosendStatus === "sending" ? (
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
            Queue
          </Button>
        )}
      </TableCell>
      <TableCell>{target.contactsCount}</TableCell>

      <TableCell>{target.deliverabilityStats.deliveredCount}</TableCell>
      <TableCell>
        <span
          style={{
            color: hasHighUnhandledReplies ? red[600] : "black"
          }}
        >
          {target.stats?.receivedMessagesCount}
        </span>
      </TableCell>
      <TableCell>{target.stats?.optOutsCount}</TableCell>
      <TableCell>{target.contactsCount! - totalSent!}</TableCell>
      <TableCell>{waitingToDeliver}</TableCell>
      <TableCell>{target.deliverabilityStats.errorCount}</TableCell>
      <TableCell>
        <Link to={`/admin/${organizationId}/campaigns/${target.id}`}>
          <MoreIcon />
        </Link>
      </TableCell>
    </TableRow>
  );
};

export default AutosendingTargetRow;
