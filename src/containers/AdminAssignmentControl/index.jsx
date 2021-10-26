import { gql } from "@apollo/client";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import { Card, CardActions, CardHeader, CardText } from "material-ui/Card";
import FlatButton from "material-ui/FlatButton";
import RaisedButton from "material-ui/RaisedButton";
import PropTypes from "prop-types";
import React, { Component } from "react";

import { loadData } from "../hoc/with-operations";
import AssignmentRow from "./AssignmentRow";

class AdminAssignmentControl extends Component {
  state = {
    changes: {},
    working: false,
    error: undefined
  };

  assignmentPoolsWithChanges = () => {
    const { changes } = this.state;
    let assignmentPools = this.assignmentPoolsFromProps();
    assignmentPools = assignmentPools.map((pool) => {
      const poolChanges = changes[pool.id] || {};
      return Object.assign(pool, poolChanges);
    });
    return assignmentPools;
  };

  assignmentPoolsFromProps = () => {
    const {
      textRequestFormEnabled,
      textRequestType,
      textRequestMaxCount,
      teams
    } = this.props.assignmentConfiguration.organization;
    const generalAssignment = {
      id: "general",
      title: "General",
      textColor: "",
      backgroundColor: "",
      isAssignmentEnabled: textRequestFormEnabled,
      assignmentType: textRequestType,
      maxRequestCount: textRequestMaxCount,
      escalationTags: []
    };

    const assignmentPools = [generalAssignment].concat(teams);
    return assignmentPools;
  };

  createHandleChangeAssignment = (poolId) => (payload) => {
    const { changes } = this.state;
    const poolChanges = this.state.changes[poolId] || {};
    changes[poolId] = Object.assign(poolChanges, payload);
    this.setState({ changes });
  };

  handleSaveAssignmentControls = async () => {
    const { changes } = this.state;
    const payloads = Object.keys(changes).map((key) => {
      const teamPayload = { ...changes[key], id: key };

      if (teamPayload.escalationTags) {
        teamPayload.escalationTagIds = teamPayload.escalationTags.map(
          (t) => t.id
        );
        delete teamPayload.escalationTags;
      }

      return teamPayload;
    });

    this.setState({ working: true });
    try {
      const response = await this.props.mutations.saveTeams(payloads);
      if (response.errors) throw response.errors;
      this.setState({ changes: {} });
    } catch (err) {
      this.setState({ error: err.message });
    } finally {
      this.setState({ working: false });
    }
  };

  handleCloseDialog = () => this.setState({ error: undefined });

  render() {
    const { className, containerStyle, style } = this.props;
    const { changes, working, error } = this.state;
    const hasChanges = Object.keys(changes).length > 0;

    const assignmentPools = this.assignmentPoolsWithChanges();
    const escalationTagList = this.props.assignmentConfiguration.organization
      ? this.props.assignmentConfiguration.organization.escalationTagList
      : [];

    const dialogActions = [
      <FlatButton
        key="close"
        label="Close"
        primary
        onClick={this.handleCloseDialog}
      />
    ];

    return (
      <Card className={className} containerStyle={containerStyle} style={style}>
        <CardHeader title="Assignment Request Controls" />
        <CardText>
          {assignmentPools.map((assignmentPool) => (
            <AssignmentRow
              key={assignmentPool.id}
              assignmentPool={assignmentPool}
              escalationTagList={escalationTagList}
              isRowDisabled={working}
              onChange={this.createHandleChangeAssignment(assignmentPool.id)}
            />
          ))}
        </CardText>
        <CardActions style={{ textAlign: "right" }}>
          <RaisedButton
            label="Save"
            primary
            disabled={working || !hasChanges}
            onClick={this.handleSaveAssignmentControls}
          />
        </CardActions>
        <Dialog open={!!error} onClose={this.handleCloseDialog}>
          <DialogTitle>Error saving Assignment Controls</DialogTitle>
          <DialogContent>
            <DialogContentText>{error}</DialogContentText>
          </DialogContent>
          <DialogActions>{dialogActions}</DialogActions>
        </Dialog>
      </Card>
    );
  }
}

const queries = {
  assignmentConfiguration: {
    query: gql`
      query getAssignmentConfiguration($organizationId: String!) {
        organization(id: $organizationId) {
          id
          textRequestFormEnabled
          textRequestType
          textRequestMaxCount
          escalationTagList {
            id
            title
          }
          teams {
            id
            title
            textColor
            backgroundColor
            isAssignmentEnabled
            assignmentType
            maxRequestCount
            escalationTags {
              id
              title
            }
          }
        }
      }
    `,
    options: (ownProps) => ({
      variables: {
        organizationId: ownProps.match.params.organizationId
      }
    })
  }
};

const mutations = {
  saveTeams: (ownProps) => (teams) => ({
    mutation: gql`
      mutation saveTeams($organizationId: String!, $teams: [TeamInput]!) {
        saveTeams(organizationId: $organizationId, teams: $teams) {
          id
          title
          textColor
          backgroundColor
          isAssignmentEnabled
          assignmentType
          maxRequestCount
          escalationTags {
            id
            title
          }
        }
      }
    `,
    variables: {
      organizationId: ownProps.match.params.organizationId,
      teams
    },
    refetchQueries: ["getAssignmentConfiguration"]
  })
};

AdminAssignmentControl.defaultProps = {
  className: "",
  containerStyle: {},
  style: {}
};

AdminAssignmentControl.propTypes = {
  match: PropTypes.object.isRequired,
  assignmentConfiguration: PropTypes.object.isRequired,
  mutations: PropTypes.shape({
    saveTeams: PropTypes.func.isRequired
  }).isRequired,
  className: PropTypes.string,
  containerStyle: PropTypes.object,
  style: PropTypes.object
};

export default loadData({
  queries,
  mutations
})(AdminAssignmentControl);
