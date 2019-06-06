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
import LoadingIndicator from "../../components/LoadingIndicator";

export const RowWorkState = Object.freeze({
  Inactive: 0,
  Error: 1,
  Working: 2,
  Approved: 3,
  Denied: 4
});

const rowStyleForState = rowState => {
  switch (rowState) {
    case RowWorkState.Error:
      return { backgroundColor: theme.colors.lightGray, ...fadeOutStyle };
    case RowWorkState.Approved:
      return { backgroundColor: theme.colors.green, ...fadeOutStyle };
    case RowWorkState.Denied:
      return { backgroundColor: theme.colors.lightRed };
    default:
      return undefined;
  }
};

const fadeOutStyle = {
  "-webkit-transition": "opacity 3s ease-in-out",
  "-moz-transition": "opacity 3s ease-in-out",
  "-ms-transition": "opacity 3s ease-in-out",
  "-o-transition": "opacity 3s ease-in-out",
  transition: "opacity 3s ease-in-out",
  opacity: 1
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
            const { user, createdAt, id: requestId, state } = request;
            const showActions =
              state === RowWorkState.Inactive || state === RowWorkState.Error;
            return (
              <TableRow key={requestId} style={rowStyleForState(state)}>
                <TableRowColumn>
                  {user.firstName} {user.lastName}
                </TableRowColumn>
                <TableRowColumn>{request.amount}</TableRowColumn>
                <TableRowColumn>{moment(createdAt).fromNow()}</TableRowColumn>
                <TableRowColumn>
                  {state === RowWorkState.Error && (
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
                  {state === RowWorkState.Working && (
                    <CircularProgress size={25} />
                  )}
                </TableRowColumn>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {assignmentRequests.length === 0 && <LoadingIndicator />}
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
      createdAt: PropTypes.instanceOf(Date),
      state: PropTypes.number.isRequired
    })
  ),
  onApproveRequest: PropTypes.func.isRequired,
  onDenyRequest: PropTypes.func.isRequired
};

export default AssignmentRequestTable;
