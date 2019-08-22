import React, { Component } from "react";
import PropTypes from "prop-types";
import gql from "graphql-tag";

import { Card, CardText, CardActions, CardHeader } from "material-ui/Card";
import AutoComplete from "material-ui/AutoComplete";
import Dialog from "material-ui/Dialog";
import RaisedButton from "material-ui/RaisedButton";
import FlatButton from "material-ui/FlatButton";

import { TextRequestType } from "../../api/organization";
import loadData from "../../containers/hoc/load-data";
import AssignmentRow from "./AssignmentRow";

// Mapping from Team type to AutoComplete data source
const dataSourceConfig = {
  text: "title",
  value: "id"
};

class AdminAssignmentControl extends Component {
  state = {
    generalAssignment: {
      teamId: "general",
      teamName: "General",
      assignmentType: "NONE",
      maxCount: 100
    },
    teamAssignments: [],
    working: false,
    error: undefined
  };

  selectableTeams = () => {
    const { teamAssignments } = this.state;
    const { teams = [] } = this.props.organizationTeams.organization;
    const assignedTeamIds = new Set(
      teamAssignments.map(assignment => assignment.teamId)
    );
    return teams.filter(team => !assignedTeamIds.has(team.id));
  };

  handleTeamSelection = (team, index) => {
    // Do not handle <enter> as we only want to allow selection directly from the list
    if (index === -1) return;

    const { teamAssignments } = this.state;
    const assignmentPredicate = assignment => assignment.teamId === team.id;
    const isAlreadyAssigned =
      teamAssignments.findIndex(assignmentPredicate) > -1;
    if (isAlreadyAssigned) return;

    teamAssignments.push({
      teamId: team.id,
      teamName: team.title,
      assignmentType: TextRequestType.UNSENT,
      maxCount: 500
    });
    this.setState({ teamAssignments });
  };

  handleChangeGeneralAssignment = payload => {
    const { generalAssignment } = this.state;
    Object.assign(generalAssignment, payload);
    return this.setState({ generalAssignment });
  };

  handleDeleteGeneralAssignment = () => {
    const { generalAssignment } = this.state;
    Object.assign(generalAssignment, { assignmentType: "NONE" });
    return this.setState({ generalAssignment });
  };

  createHandleChangeAssignment = teamId => payload => {
    const { teamAssignments } = this.state;
    const assignment = teamAssignments.find(
      assignment => assignment.teamId === teamId
    );
    Object.assign(assignment, payload);
    this.setState({ teamAssignments });
  };

  createHandleDeleteAssignment = teamId => () => {
    const teamAssignments = this.state.teamAssignments.filter(
      assignment => assignment.teamId !== teamId
    );
    this.setState({ teamAssignments });
  };

  handleSaveAssignmentControls = () => {
    this.setState({ working: true });
    try {
      // TODO -- stub
      const response = { success: "true" };
      if (response.errors) throw response.errors;
    } catch (err) {
      this.setState({ error: err.message });
    } finally {
      this.setState({ working: false });
    }
  };

  handleCloseDialog = () => this.setState({ error: undefined });

  render() {
    const { className, containerStyle, style } = this.props;
    const { generalAssignment, teamAssignments, working, error } = this.state;

    const dialogActions = [
      <FlatButton
        label="Close"
        primary={true}
        onClick={this.handleCloseDialog}
      />
    ];

    return (
      <Card className={className} containerStyle={containerStyle} style={style}>
        <CardHeader title="Assignment Request Controls" />
        <CardText>
          <AssignmentRow
            assignment={generalAssignment}
            canBeNoneType={true}
            isRowDisabled={working}
            onChange={this.handleChangeGeneralAssignment}
            onDelete={this.handleDeleteGeneralAssignment}
          />
          {teamAssignments.map(assignment => (
            <AssignmentRow
              key={assignment.teamId}
              assignment={assignment}
              isRowDisabled={working}
              onChange={this.createHandleChangeAssignment(assignment.teamId)}
              onDelete={this.createHandleDeleteAssignment(assignment.teamId)}
            />
          ))}
          <AutoComplete
            floatingLabelText="Select team"
            filter={AutoComplete.fuzzyFilter}
            openOnFocus={true}
            dataSource={this.selectableTeams()}
            dataSourceConfig={dataSourceConfig}
            disabled={working}
            onNewRequest={this.handleTeamSelection}
          />
        </CardText>
        <CardActions>
          <RaisedButton
            label="Save"
            primary
            disabled={working}
            onClick={this.handleSaveAssignmentControls}
          />
        </CardActions>
        <Dialog
          title={"Error saving Assignment Controls"}
          actions={dialogActions}
          modal={false}
          open={!!error}
          onRequestClose={this.handleCloseDialog}
        >
          {error}
        </Dialog>
      </Card>
    );
  }
}

const mapQueriesToProps = ({ ownProps }) => ({
  organizationTeams: {
    query: gql`
      query getOrganizationTeams($organizationId: String!) {
        organization(id: $organizationId) {
          id
          teams {
            id
            title
            description
            textColor
            backgroundColor
            assignmentPriority
          }
        }
      }
    `,
    variables: {
      organizationId: ownProps.params.organizationId
    }
  }
});

const mapMutationsToProps = () => ({
  // TODO -- stub
});

AdminAssignmentControl.defaultProps = {
  className: "",
  containerStyle: {},
  style: {}
};

AdminAssignmentControl.propTypes = {
  params: PropTypes.object.isRequired,
  organizationId: PropTypes.string.isRequired,
  organizationTeams: PropTypes.object.isRequired,
  className: PropTypes.string,
  containerStyle: PropTypes.object,
  style: PropTypes.object
};

export default loadData(AdminAssignmentControl, {
  mapMutationsToProps,
  mapQueriesToProps
});
