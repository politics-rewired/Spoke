import { gql } from "@apollo/client";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Fab from "@material-ui/core/Fab";
import AddIcon from "@material-ui/icons/Add";
import pick from "lodash/pick";
import TextField from "material-ui/TextField";
import PropTypes from "prop-types";
import React, { Component } from "react";

import LoadingIndicator from "../../components/LoadingIndicator";
import theme from "../../styles/theme";
import {
  formatErrorMessage,
  PrettyErrors,
  withOperations
} from "../hoc/with-operations";
import TeamEditorList from "./components/TeamEditorList";

class AdminTeamEditor extends Component {
  state = {
    editingTeam: undefined,
    isWorking: false,
    error: undefined
  };

  getTeam = (teamId) => {
    const { teams = [] } = this.props.organizationTeams.organization || {};
    return {
      ...teams.find((team) => team.id === teamId)
    };
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

  handleEditTeam = (teamId) =>
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
    if ("assignmentPriority" in team) {
      const rawPriority = team.assignmentPriority;
      team.assignmentPriority =
        rawPriority === "" ? 500 : parseInt(rawPriority, 10);
    }

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

  handleDeleteTeam = async (teamId) => {
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
      <Button key="cancel" onClick={this.handleCancelEditTeam}>
        Cancel
      </Button>,
      <Button key={teamVerb} color="primary" onClick={this.handleSaveTeam}>
        {teamVerb}
      </Button>
    ];

    const errorActions = [
      <Button key="ok" color="primary" onClick={this.handleCancelError}>
        Ok
      </Button>
    ];

    return (
      <div>
        <TeamEditorList
          organizationId={organizationId}
          teams={teams}
          onEditTeam={this.handleEditTeam}
          onDeleteTeam={this.handleDeleteTeam}
        />
        <Fab
          color="primary"
          style={theme.components.floatingButton}
          disabled={isWorking}
          onClick={this.handleClickAddTeam}
        >
          <AddIcon />
        </Fab>
        {editingTeam && (
          <Dialog open onClose={this.handleCancelEditTeam}>
            <DialogTitle>{`${teamVerb} Team`}</DialogTitle>
            <DialogContent>
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
                multiLine
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
            </DialogContent>
            <DialogActions>{actions}</DialogActions>
          </Dialog>
        )}
        <Dialog open={error !== undefined} onClose={this.handleCancelError}>
          <DialogTitle>Error</DialogTitle>
          <DialogContent>
            <DialogContentText>{error || ""}</DialogContentText>
          </DialogContent>
          <DialogActions>{errorActions}</DialogActions>
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
        }
      }
    `,
    variables: {
      organizationId: ownProps.match.params.organizationId,
      teams
    },
    refetchQueries: ["getOrganizationTeams"]
  }),
  deleteTeam: (ownProps) => (teamId) => ({
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
