import { DateTime } from "luxon";
import CircularProgress from "material-ui/CircularProgress";
import FlatButton from "material-ui/FlatButton";
import IconButton from "material-ui/IconButton";
import { green300, red500 } from "material-ui/styles/colors";
import AssignmentTurnedInIcon from "material-ui/svg-icons/action/assignment-turned-in";
import CheckCircleIcon from "material-ui/svg-icons/action/check-circle";
import HighlightOffIcon from "material-ui/svg-icons/action/highlight-off";
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn
} from "material-ui/Table";
import PropTypes from "prop-types";
import React from "react";

import theme from "../../styles/theme";

export const RowWorkStatus = Object.freeze({
  Inactive: "pending",
  Error: "error",
  Working: "working",
  Approved: "approved",
  Denied: "rejected"
});

const rowStyleForStatus = (rowStatus) => {
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

const AssignmentRequestTable = (props) => {
  const {
    isAdmin,
    assignmentRequests,
    onAutoApproveRequest,
    onApproveRequest,
    onDenyRequest
  } = props;

  const handleAutoApproveRow = (requestId) => () =>
    onAutoApproveRequest(requestId);
  const handleApproveRow = (requestId) => () => onApproveRequest(requestId);
  const handleDenyRow = (requestId) => () => onDenyRequest(requestId);

  return (
    <div>
      <Table selectable={false}>
        <TableHeader enableSelectAll={false} displaySelectAll={false}>
          <TableHeaderColumn>Texter</TableHeaderColumn>
          <TableHeaderColumn>Request Amount</TableHeaderColumn>
          <TableHeaderColumn>Requested At</TableHeaderColumn>
          <TableHeaderColumn>Actions</TableHeaderColumn>
        </TableHeader>
        <TableBody displayRowCheckbox={false}>
          {assignmentRequests.map((request) => {
            const { user, createdAt, id: requestId, status } = request;
            const showActions =
              status === RowWorkStatus.Inactive ||
              status === RowWorkStatus.Error;
            return (
              <TableRow key={requestId} style={rowStyleForStatus(status)}>
                <TableRowColumn>
                  {user.firstName} {user.lastName}
                </TableRowColumn>
                <TableRowColumn>{request.amount}</TableRowColumn>
                <TableRowColumn>
                  {DateTime.fromISO(createdAt).toRelative()}
                </TableRowColumn>
                <TableRowColumn>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    {status === RowWorkStatus.Error && (
                      <span style={styles.errorText}>Error. Try again.</span>
                    )}
                    {showActions && (
                      <IconButton
                        tooltip="Deny"
                        tooltipPosition="top-center"
                        onClick={handleDenyRow(requestId)}
                      >
                        <HighlightOffIcon color={red500} />
                      </IconButton>
                    )}
                    {showActions && (
                      <IconButton
                        tooltip="Approve"
                        tooltipPosition="top-center"
                        onClick={handleApproveRow(requestId)}
                      >
                        <CheckCircleIcon color={green300} />
                      </IconButton>
                    )}
                    {showActions && isAdmin && (
                      <FlatButton
                        label="AutoApprove"
                        labelPosition="before"
                        primary
                        icon={<AssignmentTurnedInIcon color={green300} />}
                        onClick={handleAutoApproveRow(requestId)}
                      />
                    )}
                    {status === RowWorkStatus.Working && (
                      <CircularProgress size={25} />
                    )}
                  </div>
                </TableRowColumn>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

AssignmentRequestTable.propTypes = {
  isAdmin: PropTypes.bool.isRequired,
  assignmentRequests: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      user: PropTypes.shape({
        id: PropTypes.string.isRequired,
        firstName: PropTypes.string.isRequired,
        lastName: PropTypes.string.isRequired
      }).isRequired,
      amount: PropTypes.number.isRequired,
      createdAt: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired
    })
  ),
  onApproveRequest: PropTypes.func.isRequired,
  onDenyRequest: PropTypes.func.isRequired
};

export default AssignmentRequestTable;
