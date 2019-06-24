import React, { Component } from "react";
import PropTypes from "prop-types";
import gql from "graphql-tag";
import AssignmentRequestTable, {
  RowWorkStatus
} from "./AssignmentRequestTable";
import loadData from "../hoc/load-data";
import wrapMutations from "../hoc/wrap-mutations";
import { sleep } from "../../lib/utils";
import CircularProgress from "material-ui/CircularProgress";

class AdminAssignmentRequest extends Component {
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
    if (!nextProps.pendingAssignmentRequests) {
      return;
    }

    const newRequestIds = nextProps.pendingAssignmentRequests.assignmentRequests.map(
      r => r.id
    );

    const deletableOldRequestIds = this.state.assignmentRequests
      .filter(r => r.status === "pending")
      .map(r => r.id);

    const toAdd = newRequestIds.filter(
      rId => !deletableOldRequestIds.includes(rId)
    );

    const toDelete = deletableOldRequestIds.filter(
      rId => !newRequestIds.includes(rId)
    );

    if (toAdd.length > 0) {
      for (let rId of toAdd) {
        const r = nextProps.pendingAssignmentRequests.assignmentRequests.find(
          r => r.id === rId
        );
        this.state.assignmentRequests.push(r);
      }
    }

    if (toDelete.length > 0) {
      this.state.pendingAssignmentRequests = this.state.assignmentRequests.filter(
        r => !toDelete.includes(r.id)
      );
    }

    if (toAdd.length > 0 || toDelete.length > 0) {
      console.log({ toAdd, toDelete });
      // this.forceUpdate();
    }
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
    forceFetch: true,
    pollInterval: 10000
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
