import Chip from "@material-ui/core/Chip";
import grey from "@material-ui/core/colors/grey";
import { makeStyles } from "@material-ui/core/styles";
import TableCell from "@material-ui/core/TableCell";
import TableRow from "@material-ui/core/TableRow";
import MoreIcon from "@material-ui/icons/ArrowForward";
import { AutosendingTargetFragment } from "@spoke/spoke-codegen";
import React from "react";
import { Link } from "react-router-dom";

const useStyles = makeStyles({
  unstarted: {
    backgroundColor: grey[300]
  }
});

interface AutosendingUnstartedTargetRowProps {
  target: AutosendingTargetFragment;
  organizationId: string;
}

// eslint-disable-next-line max-len
export const AutosendingUnstartedTargetRow: React.FC<AutosendingUnstartedTargetRowProps> = (
  props
) => {
  const { target, organizationId } = props;
  const chipClasses = useStyles();

  return (
    <TableRow>
      <TableCell>
        {target.id}: {target.title}
      </TableCell>
      <TableCell>
        <Chip
          label="Unstarted Campaign"
          classes={{ root: chipClasses.unstarted }}
        />
      </TableCell>
      <TableCell />
      <TableCell>
        <Link to={`/admin/${organizationId}/campaigns/${target.id}`}>
          <MoreIcon />
        </Link>
      </TableCell>
    </TableRow>
  );
};

export default AutosendingUnstartedTargetRow;
