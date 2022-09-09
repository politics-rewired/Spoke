import Button from "@material-ui/core/Button";
import { red } from "@material-ui/core/colors";
import Paper from "@material-ui/core/Paper";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import CreateIcon from "@material-ui/icons/Create";
import DeleteForeverIcon from "@material-ui/icons/DeleteForever";
import PropTypes from "prop-types";
import React, { Component } from "react";
import { withRouter } from "react-router-dom";

const styles = {
  row: { cursor: "pointer" }
};

class TeamEditorList extends Component {
  createHandleEditTeam = (teamId) => (event) => {
    event.stopPropagation();
    this.props.oEditTeam(teamId);
  };

  createHandleDeleteTeam = (teamId) => (event) => {
    event.stopPropagation();
    this.props.onDeleteTeam(teamId);
  };

  handleClickFactory = (teamId) => () => {
    const { organizationId, history } = this.props;
    const teamPagePath = `/admin/${organizationId}/teams/${teamId}`;
    history.push(teamPagePath);
  };

  render() {
    const { teams } = this.props;

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Priority</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teams.map((team) => (
              <TableRow
                key={team.id}
                hover
                style={styles.row}
                onClick={this.handleClickFactory(team.id)}
              >
                <TableCell>{team.assignmentPriority}</TableCell>
                <TableCell>{team.title}</TableCell>
                <TableCell>{team.description}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={team.isSystem}
                    endIcon={<CreateIcon />}
                    style={{ marginRight: 10 }}
                    onClick={this.createHandleEditTeam(team.id)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="contained"
                    disabled={team.isSystem}
                    endIcon={
                      <DeleteForeverIcon
                        style={{ color: !team.isSystem ? red[500] : undefined }}
                      />
                    }
                    onClick={this.createHandleDeleteTeam(team.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }
}

TeamEditorList.defaultProps = {};

TeamEditorList.propTypes = {
  organizationId: PropTypes.string.isRequired,
  teams: PropTypes.arrayOf(PropTypes.object).isRequired,
  history: PropTypes.object.isRequired,
  oEditTeam: PropTypes.func.isRequired,
  onDeleteTeam: PropTypes.func.isRequired
};

export default withRouter(TeamEditorList);
