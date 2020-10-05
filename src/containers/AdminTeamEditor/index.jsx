import React, { Component } from "react";
import PropTypes from "prop-types";
import gql from "graphql-tag";
import pick from "lodash/pick";

import FloatingActionButton from "material-ui/FloatingActionButton";
import Dialog from "material-ui/Dialog";
import TextField from "material-ui/TextField";
import FlatButton from "material-ui/FlatButton";
import ContentAddIcon from "material-ui/svg-icons/content/add";

import {
  formatErrorMessage,
  PrettyErrors,
  withOperations
} from "../hoc/with-operations";
import LoadingIndicator from "../../components/LoadingIndicator";
import TeamEditorList from "./TeamEditorList";
import theme from "../../styles/theme";

class AdminTeamEditor extends Component {
  state = {
    editingTeam: undefined,
    isWorking: false,
    error: undefined
  };

  getTeam = teamId => {
    const { teams = [] } = this.props.organizationTeams.organization || {};
    return Object.assign({}, teams.find(team => team.id === teamId));
  };

  handleCancelError = () => this.setState({ error: undefined });

  handleClickAddTeam = () =>
    this.setState({
      editingTeam: {
        title: "",
        description: "",
        textColor: "",
        backgroundColor: "",
        assignmentPriority: 500
      }
    });

  handleEditTeam = teamId =>
    this.setState({ editingTeam: this.getTeam(teamId) });

  handleCancelEditTeam = () => this.setState({ editingTeam: undefined });

  handleSaveTeam = async () => {
    const { editingTeam } = this.state;
    const team = pick(editingTeam, [
      "id",
      "title",
      "description",
      "textColor",
      "backgroundColor",
      "assignmentPriority"
    ]);
    this.setState({ isWorking: true });
    try {
      const result = await this.props.mutations.saveTeams([team]);
      if (result.errors) throw new Error(result.errors);
    } catch (error) {
      this.setState({ error: formatErrorMessage(error.message) });
    } finally {
      this.setState({ isWorking: false });
      this.handleCancelEditTeam();
    }
  };

  handleDeleteTeam = async teamId => {
    this.setState({ isWorking: true });
    try {
      const result = await this.props.mutations.deleteTeam(teamId);
      if (result.errors) throw new Error(result.errors);
    } catch (error) {
      this.setState({ error: formatErrorMessage(error.message) });
    } finally {
      this.setState({ isWorking: false });
    }
  };

  createTeamEditorHandle = (event, value) => {
    let { editingTeam } = this.state;
    editingTeam = Object.assign(editingTeam, { [event.target.name]: value });
    this.setState({ editingTeam });
  };

  render() {
    const {
      match: {
        params: { organizationId }
      },
      organizationTeams
    } = this.props;
    const { editingTeam, isWorking, error } = this.state;

    if (organizationTeams.loading) return <LoadingIndicator />;
    if (organizationTeams.errors) {
      return <PrettyErrors errors={organizationTeams.errors} />;
    }

    const { teams } = organizationTeams.organization;

    const isNewTeam = (editingTeam || {}).id === undefined;
    const teamVerb = isNewTeam ? "Create" : "Edit";
    const actions = [
      <FlatButton label="Cancel" onClick={this.handleCancelEditTeam} />,
      <FlatButton
        label={teamVerb}
        primary={true}
        onClick={this.handleSaveTeam}
      />
    ];

    const errorActions = [
      <FlatButton label="Ok" primary={true} onClick={this.handleCancelError} />
    ];

    return (
      <div>
        <TeamEditorList
          organizationId={organizationId}
          teams={teams}
          oEditTeam={this.handleEditTeam}
          onDeleteTeam={this.handleDeleteTeam}
        />
        <FloatingActionButton
          style={theme.components.floatingButton}
          disabled={isWorking}
          onClick={this.handleClickAddTeam}
        >
          <ContentAddIcon />
        </FloatingActionButton>
        {editingTeam && (
          <Dialog
            title={`${teamVerb} Team`}
            actions={actions}
            modal={false}
            open={true}
            onRequestClose={this.handleCancelEditTeam}
          >
            <TextField
              name="title"
              floatingLabelText="Team name"
              value={editingTeam.title || ""}
              onChange={this.createTeamEditorHandle}
            />
            <br />
            <TextField
              name="description"
              floatingLabelText="Team description"
              multiLine={true}
              value={editingTeam.description || ""}
              onChange={this.createTeamEditorHandle}
            />
            <br />
            <TextField
              name="assignmentPriority"
              floatingLabelText="Assignment priority"
              value={editingTeam.assignmentPriority || 500}
              onChange={this.createTeamEditorHandle}
            />
          </Dialog>
        )}
        <Dialog
          title="Error"
          actions={errorActions}
          open={error !== undefined}
          onRequestClose={this.handleCancelError}
        >
          {error || ""}
        </Dialog>
      </div>
    );
  }
}

AdminTeamEditor.defaultProps = {};

AdminTeamEditor.propTypes = {
  match: PropTypes.object.isRequired
};

const queries = {
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
    options: ownProps => ({
      variables: {
        organizationId: ownProps.match.params.organizationId
      }
    })
  }
};

const mutations = {
  saveTeams: ownProps => teams => ({
    mutation: gql`
      mutation saveTeams($organizationId: String!, $teams: [TeamInput]!) {
        saveTeams(organizationId: $organizationId, teams: $teams) {
          id
        }
      }
    `,
    variables: {
      organizationId: ownProps.match.params.organizationId,
      teams
    },
    refetchQueries: ["getOrganizationTeams"]
  }),
  deleteTeam: ownProps => teamId => ({
    mutation: gql`
      mutation deleteTeam($organizationId: String!, $teamId: String!) {
        deleteTeam(organizationId: $organizationId, teamId: $teamId)
      }
    `,
    variables: {
      organizationId: ownProps.match.params.organizationId,
      teamId
    },
    refetchQueries: ["getOrganizationTeams"]
  })
};

export default withOperations({
  queries,
  mutations
})(AdminTeamEditor);
