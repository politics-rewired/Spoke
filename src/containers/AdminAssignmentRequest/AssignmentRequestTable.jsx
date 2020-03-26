import React from "react";
import PropTypes from "prop-types";
import moment from "moment";

import {
  Table,
  TableHeader,
  TableHeaderColumn,
  TableBody,
  TableRow,
  TableRowColumn
} from "material-ui/Table";
import RaisedButton from "material-ui/RaisedButton";
import FlatButton from "material-ui/FlatButton";
import CircularProgress from "material-ui/CircularProgress";

import theme from "../../styles/theme";

export const RowWorkStatus = Object.freeze({
  Inactive: "pending",
  Error: "error",
  Working: "working",
  Approved: "approved",
  Denied: "rejected"
});

const rowStyleForStatus = rowStatus => {
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
  return Object.assign({}, baseStyle, overrideStyle);
};

const styles = {
  errorText: {
    color: theme.colors.red,
    margin: "5px"
  }
};

const AssignmentRequestTable = props => {
  const { assignmentRequests, onApproveRequest, onDenyRequest } = props;

  const handleApproveRow = requestId => () => onApproveRequest(requestId);
  const handleDenyRow = requestId => () => onDenyRequest(requestId);

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
          {assignmentRequests.map(request => {
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
                <TableRowColumn>{moment(createdAt).fromNow()}</TableRowColumn>
                <TableRowColumn>
                  {status === RowWorkStatus.Error && (
                    <span style={styles.errorText}>Error. Try again.</span>
                  )}
                  {showActions && (
                    <FlatButton
                      label="Deny"
                      secondary={true}
                      style={{ margin: "3px" }}
                      onClick={handleDenyRow(requestId)}
                    />
                  )}
                  {showActions && (
                    <RaisedButton
                      label="Approve"
                      primary={true}
                      style={{ margin: "3px" }}
                      onClick={handleApproveRow(requestId)}
                    />
                  )}
                  {status === RowWorkStatus.Working && (
                    <CircularProgress size={25} />
                  )}
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
