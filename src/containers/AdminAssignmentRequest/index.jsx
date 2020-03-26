import React, { Component } from "react";
import PropTypes from "prop-types";
import gql from "graphql-tag";
import isEqual from "lodash/isEqual";

import CircularProgress from "material-ui/CircularProgress";

import { loadData } from "../hoc/with-operations";
import { sleep } from "../../lib/utils";
import AssignmentRequestTable, {
  RowWorkStatus
} from "./AssignmentRequestTable";

class AdminAssignmentRequest extends Component {
  state = {
    assignmentRequests: []
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
      request => request.id === requestId
    );
    if (requestIndex < 0)
      throw new Error(`Could not find request with ID ${requestId}`);
    assignmentRequests[requestIndex].status = status;
    this.setState({ assignmentRequests });
  };

  deleteRequest = requestId => {
    let { assignmentRequests } = this.state;
    assignmentRequests = assignmentRequests.filter(
      request => request.id !== requestId
    );
    this.setState({ assignmentRequests });
  };

  handleApproveRequest = async requestId => {
    console.log("Approve", requestId);
    this.setRequestStatus(requestId, RowWorkStatus.Working);
    try {
      // simulate network request
      const response = await this.props.mutations.approveAssignmentRequest(
        requestId
      );

      if (response.errors) {
        throw response.errors[0];
      }

      console.log("Approved request");
      this.setRequestStatus(requestId, RowWorkStatus.Approved);
      await sleep(2000);
      this.deleteRequest(requestId);
    } catch (exc) {
      console.log("Request approval failed", exc);
      this.setRequestStatus(requestId, RowWorkStatus.Error);
    }
  };

  handleDenyRequest = async requestId => {
    console.log("Deny", requestId);
    this.setRequestStatus(requestId, RowWorkStatus.Working);
    try {
      // simulate network request
      const response = await this.props.mutations.rejectAssignmentRequest(
        requestId
      );
      if (response.errors) throw new Error(response.errors);
      console.log("Denied request");
      this.setRequestStatus(requestId, RowWorkStatus.Denied);
      await sleep(2000);
      this.deleteRequest(requestId);
    } catch (exc) {
      this.setRequestStatus(requestId, RowWorkStatus.Error);
    }
  };

  render() {
    const { pendingAssignmentRequests } = this.props;

    if (pendingAssignmentRequests.loading) {
      return <CircularProgress />;
    }

    const { assignmentRequests } = this.state;

    return (
      <AssignmentRequestTable
        assignmentRequests={assignmentRequests}
        onApproveRequest={this.handleApproveRequest}
        onDenyRequest={this.handleDenyRequest}
      />
    );
  }
}

AdminAssignmentRequest.propTypes = {
  match: PropTypes.object.isRequired
};

const queries = {
  pendingAssignmentRequests: {
    query: gql`
      query assignmentRequests($organizationId: String!, $status: String) {
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
    options: ownProps => ({
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
  approveAssignmentRequest: ownProps => assignmentRequestId => ({
    mutation: gql`
      mutation approveAssignmentRequest($assignmentRequestId: String!) {
        approveAssignmentRequest(assignmentRequestId: $assignmentRequestId)
      }
    `,
    variables: { assignmentRequestId }
  }),
  rejectAssignmentRequest: ownProps => assignmentRequestId => ({
    mutation: gql`
      mutation rejectAssignmentRequest($assignmentRequestId: String!) {
        rejectAssignmentRequest(assignmentRequestId: $assignmentRequestId)
      }
    `,
    variables: { assignmentRequestId }
  })
};

export default loadData({
  queries,
  mutations
})(AdminAssignmentRequest);
