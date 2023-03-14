import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import { green, red } from "@material-ui/core/colors";
import IconButton from "@material-ui/core/IconButton";
import Paper from "@material-ui/core/Paper";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Tooltip from "@material-ui/core/Tooltip";
import AssignmentTurnedInIcon from "@material-ui/icons/AssignmentTurnedIn";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import HighlightOffIcon from "@material-ui/icons/HighlightOff";
import type { AssignmentRequest } from "@spoke/spoke-codegen";
import React from "react";

import { DateTime } from "../../../lib/datetime";
import theme from "../../../styles/theme";

export const RowWorkStatus = Object.freeze({
  Inactive: "pending",
  Error: "error",
  Working: "working",
  Approved: "approved",
  Denied: "rejected"
});

const rowStyleForStatus = (rowStatus: string) => {
  const baseStyle = {
    "-webkit-transition": "opacity 2s ease-in-out",
    "-moz-transition": "opacity 2s ease-in-out",
    "-ms-transition": "opacity 2s ease-in-out",
    "-o-transition": "opacity 2s ease-in-out",
    transition: "opacity 2s ease-in-out",
    opacity: 1
  };

  let overrideStyle = {};
  if (rowStatus === RowWorkStatus.Error) {
    overrideStyle = { backgroundColor: theme.colors.lightGray };
  } else if (rowStatus === RowWorkStatus.Approved) {
    overrideStyle = { opacity: 0, backgroundColor: theme.colors.green };
  } else if (rowStatus === RowWorkStatus.Denied) {
    overrideStyle = { opacity: 0, backgroundColor: theme.colors.lightRed };
  }
  return { ...baseStyle, ...overrideStyle };
};

const styles = {
  errorText: {
    color: theme.colors.red,
    margin: "5px"
  }
};

interface AssignmentRequestTableProps {
  isAdmin: boolean;
  assignmentRequests: AssignmentRequest[];
  onApproveRequest: (requestId: string) => Promise<void> | void;
  onAutoApproveRequest: (requestId: string) => Promise<void> | void;
  onDenyRequest: (requestId: string) => Promise<void> | void;
}

const AssignmentRequestTable: React.FC<AssignmentRequestTableProps> = (
  props
) => {
  const {
    isAdmin,
    assignmentRequests,
    onAutoApproveRequest,
    onApproveRequest,
    onDenyRequest
  } = props;

  const handleAutoApproveRow = (requestId: string) => () =>
    onAutoApproveRequest(requestId);
  const handleApproveRow = (requestId: string) => () =>
    onApproveRequest(requestId);
  const handleDenyRow = (requestId: string) => () => onDenyRequest(requestId);

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Texter</TableCell>
            <TableCell>Request Amount</TableCell>
            <TableCell>Requested At</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {assignmentRequests.map((request) => {
            const { user, createdAt, id: requestId, status } = request;
            const showActions =
              status === RowWorkStatus.Inactive ||
              status === RowWorkStatus.Error;
            return (
              <TableRow key={requestId} style={rowStyleForStatus(status)}>
                <TableCell>
                  {user.firstName} {user.lastName}
                </TableCell>
                <TableCell>{request.amount}</TableCell>
                <TableCell>
                  {DateTime.fromISO(createdAt).toRelative()}
                </TableCell>
                <TableCell>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    {status === RowWorkStatus.Error && (
                      <span style={styles.errorText}>Error. Try again.</span>
                    )}
                    {showActions && (
                      <Tooltip title="Deny" placement="top">
                        <IconButton onClick={handleDenyRow(requestId)}>
                          <HighlightOffIcon style={{ color: red[500] }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {showActions && (
                      <Tooltip title="Approve" placement="top">
                        <IconButton onClick={handleApproveRow(requestId)}>
                          <CheckCircleIcon style={{ color: green[300] }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {showActions && isAdmin && (
                      <Button
                        color="primary"
                        endIcon={
                          <AssignmentTurnedInIcon
                            style={{ color: green[300] }}
                          />
                        }
                        onClick={handleAutoApproveRow(requestId)}
                      >
                        AutoApprove
                      </Button>
                    )}
                    {status === RowWorkStatus.Working && (
                      <CircularProgress size={25} />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default AssignmentRequestTable;
