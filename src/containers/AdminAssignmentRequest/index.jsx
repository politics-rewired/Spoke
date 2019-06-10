import React, { Component } from "react";
import PropTypes from "prop-types";
import gql from "graphql-tag";
import AssignmentRequestTable, {
  RowWorkStatus
} from "./AssignmentRequestTable";
import loadData from "../hoc/load-data";
import wrapMutations from "../hoc/wrap-mutations";
import CircularProgress from "material-ui/CircularProgress";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class AdminAssignmentRequest extends Component {
  timers = [];

  state = {
    assignmentRequests: []
  };

  componentWillUpdate(nextProps) {
    this.updateAssignmentRequestStateWithNewProps(nextProps);
  }

  componentWillMount() {
    this.updateAssignmentRequestStateWithNewProps(this.props);
  }

  updateAssignmentRequestStateWithNewProps(nextProps) {
    if (
      nextProps.pendingAssignmentRequests.assignmentRequests &&
      nextProps.pendingAssignmentRequests.assignmentRequests.length !==
        this.state.assignmentRequests
    ) {
      this.state.assignmentRequests =
        nextProps.pendingAssignmentRequests.assignmentRequests;
    }
  }

  componentWillUnmount() {
    this.timers.forEach(timer => clearTimeout(timer));
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
      const response = await this.props.mutations.rejectAssignmentRequest(requestId);
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
  params: PropTypes.object.isRequired
};

const mapQueriesToProps = ({ ownProps }) => ({
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
    variables: {
      organizationId: ownProps.params.organizationId,
      status: "pending"
    },
    forceFetch: true
  }
});

const mapMutationsToProps = ({ ownProps }) => ({
  approveAssignmentRequest: assignmentRequestId => ({
    mutation: gql`
      mutation approveAssignmentRequest($assignmentRequestId: String!) {
        approveAssignmentRequest(assignmentRequestId: $assignmentRequestId)
      }
    `,
    variables: { assignmentRequestId }
  }),
  rejectAssignmentRequest: assignmentRequestId => ({
    mutation: gql`
      mutation rejectAssignmentRequest($assignmentRequestId: String!) {
        rejectAssignmentRequest(assignmentRequestId: $assignmentRequestId)
      }
    `,
    variables: { assignmentRequestId }
  })
});

export default loadData(wrapMutations(AdminAssignmentRequest), {
  mapQueriesToProps,
  mapMutationsToProps
});
