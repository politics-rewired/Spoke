import gql from "graphql-tag";
import isEqual from "lodash/isEqual";
import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
import PropTypes from "prop-types";
import React, { Component } from "react";

import { RequestAutoApproveType } from "../../api/organization-membership";
import { hasRole } from "../../lib/permissions";
import { sleep } from "../../lib/utils";
import { loadData } from "../hoc/with-operations";
import AssignmentRequestTable, {
  RowWorkStatus
} from "./AssignmentRequestTable";

class AdminAssignmentRequest extends Component {
  state = {
    assignmentRequests: [],
    autoApproveReqId: undefined
  };

  componentWillUpdate(nextProps) {
    this.updateAssignmentRequestStateWithNewProps(this.props, nextProps);
  }

  componentWillMount() {
    this.updateAssignmentRequestStateWithNewProps(null, this.props);
  }

  updateAssignmentRequestStateWithNewProps(lastProps, nextProps) {
    if (
      lastProps &&
      lastProps.pendingAssignmentRequests.assignmentRequests &&
      nextProps.pendingAssignmentRequests.assignmentRequests &&
      isEqual(
        lastProps.pendingAssignmentRequests.assignmentRequests,
        nextProps.pendingAssignmentRequests.assignmentRequests
      )
    ) {
      // Ignore the props/state update unless server-provided assignmentRequests have changed
      return;
    }

    const { assignmentRequests } = nextProps.pendingAssignmentRequests;
    this.state.assignmentRequests = assignmentRequests;
  }

  setRequestStatus = (requestId, status) => {
    const { assignmentRequests } = this.state;
    const requestIndex = assignmentRequests.findIndex(
      (request) => request.id === requestId
    );
    if (requestIndex < 0)
      throw new Error(`Could not find request with ID ${requestId}`);
    assignmentRequests[requestIndex].status = status;
    this.setState({ assignmentRequests });
  };

  deleteRequest = (requestId) => {
    let { assignmentRequests } = this.state;
    assignmentRequests = assignmentRequests.filter(
      (request) => request.id !== requestId
    );
    this.setState({ assignmentRequests });
  };

  handleDismissAutoApproveRequest = () =>
    this.setState({ autoApproveReqId: undefined });

  handleAutoApproveRequest = (autoApproveReqId) =>
    this.setState({ autoApproveReqId });

  handleConfirmAutoApprove = () => {
    const { autoApproveReqId } = this.state;
    this.setState({ autoApproveReqId: undefined });
    this.resolveRequest(autoApproveReqId, true, true);
  };

  handleResolveRequest = (approved) => (requestId) =>
    this.resolveRequest(requestId, approved);

  resolveRequest = async (requestId, approved, autoApprove = false) => {
    const { resolveAssignmentRequest } = this.props.mutations;
    this.setRequestStatus(requestId, RowWorkStatus.Working);
    try {
      const level = autoApprove ? RequestAutoApproveType.AUTO_APPROVE : null;
      const response = await resolveAssignmentRequest(
        requestId,
        approved,
        level
      );
      if (response.errors) throw response.errors[0];

      const newStatus = approved
        ? RowWorkStatus.Approved
        : RowWorkStatus.Denied;
      this.setRequestStatus(requestId, newStatus);
      await sleep(2000);
      this.deleteRequest(requestId);
    } catch (exc) {
      console.error(
        `Resolve request as "${approved ? "approved" : "denied"}" failed: `,
        exc
      );
      this.setRequestStatus(requestId, RowWorkStatus.Error);
    }
  };

  render() {
    const { currentUser } = this.props.pendingAssignmentRequests;
    const { assignmentRequests, autoApproveReqId } = this.state;
    const autoApproveRequest =
      autoApproveReqId &&
      assignmentRequests.find(({ id }) => id === autoApproveReqId);

    const autoApproveActions = [
      <FlatButton label="Confirm" onClick={this.handleConfirmAutoApprove} />,
      <FlatButton
        label="Cancel"
        primary
        onClick={this.handleDismissAutoApproveRequest}
      />
    ];

    return (
      <div>
        <AssignmentRequestTable
          isAdmin={hasRole("ADMIN", currentUser.roles)}
          assignmentRequests={assignmentRequests}
          onAutoApproveRequest={this.handleAutoApproveRequest}
          onApproveRequest={this.handleResolveRequest(true)}
          onDenyRequest={this.handleResolveRequest(false)}
        />
        <Dialog
          title="Confirm Enable AutoAssignment"
          open={!!autoApproveRequest}
          actions={autoApproveActions}
          onRequestClose={this.handleDismissAutoApproveRequest}
        >
          <p>
            Are you sure you would like to enable automatic assignment request
            fulfillment for {((autoApproveRequest || {}).user || {}).firstName}{" "}
            {((autoApproveRequest || {}).user || {}).lastName}?
          </p>
          <p>
            If enabled, all future assignment requests for this user will be
            automatically fulfilled. This can be changed at any time from the
            People page.
          </p>
        </Dialog>
      </div>
    );
  }
}

AdminAssignmentRequest.propTypes = {
  match: PropTypes.object.isRequired
};

const queries = {
  pendingAssignmentRequests: {
    query: gql`
      query assignmentRequestsWithUser(
        $organizationId: String!
        $status: String
      ) {
        currentUser {
          id
          roles(organizationId: "1")
        }
        assignmentRequests(organizationId: $organizationId, status: $status) {
          id
          createdAt
          amount
          status
          user {
            id
            firstName
            lastName
          }
        }
      }
    `,
    options: (ownProps) => ({
      variables: {
        organizationId: ownProps.match.params.organizationId,
        status: "pending"
      },
      fetchPolicy: "network-only",
      pollInterval: 10000
    })
  }
};

const mutations = {
  resolveAssignmentRequest: (ownProps) => (
    assignmentRequestId,
    approved,
    autoApproveLevel
  ) => ({
    mutation: gql`
      mutation resolveAssignmentRequest(
        $assignmentRequestId: String!
        $approved: Boolean!
        $autoApproveLevel: RequestAutoApprove
      ) {
        resolveAssignmentRequest(
          assignmentRequestId: $assignmentRequestId
          approved: $approved
          autoApproveLevel: $autoApproveLevel
        )
      }
    `,
    variables: { assignmentRequestId, approved, autoApproveLevel }
  })
};

export default loadData({
  queries,
  mutations
})(AdminAssignmentRequest);
