import { red } from "@material-ui/core/colors";
import CreateIcon from "@material-ui/icons/Create";
import DeleteForeverIcon from "@material-ui/icons/DeleteForever";
import RaisedButton from "material-ui/RaisedButton";
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn
} from "material-ui/Table";
import PropTypes from "prop-types";
import React, { Component } from "react";
import { withRouter } from "react-router-dom";

const ACTIONS_COLUMN_INDEX = 3;

const styles = {
  row: { cursor: "pointer" }
};

class TeamEditorList extends Component {
  createHandleEditTeam = (teamId) => () => this.props.oEditTeam(teamId);

  createHandleDeleteTeam = (teamId) => () => this.props.onDeleteTeam(teamId);

  handleCellClick = (rowIndex, columnIndex) => {
    if (columnIndex === ACTIONS_COLUMN_INDEX) return;

    const { organizationId, teams, history } = this.props;
    const team = teams[rowIndex];
    const teamPagePath = `/admin/${organizationId}/teams/${team.id}`;
    history.push(teamPagePath);
  };

  render() {
    const { teams } = this.props;

    return (
      <Table
        selectable={false}
        multiSelectable={false}
        onCellClick={this.handleCellClick}
      >
        <TableHeader
          enableSelectAll={false}
          displaySelectAll={false}
          adjustForCheckbox={false}
        >
          <TableRow>
            <TableHeaderColumn>Priority</TableHeaderColumn>
            <TableHeaderColumn>Name</TableHeaderColumn>
            <TableHeaderColumn>Description</TableHeaderColumn>
            <TableHeaderColumn>Actions</TableHeaderColumn>
          </TableRow>
        </TableHeader>
        <TableBody displayRowCheckbox={false} showRowHover>
          {teams.map((team) => (
            <TableRow key={team.id} selectable style={styles.row}>
              <TableRowColumn>{team.assignmentPriority}</TableRowColumn>
              <TableRowColumn>{team.title}</TableRowColumn>
              <TableRowColumn>{team.description}</TableRowColumn>
              <TableRowColumn>
                <RaisedButton
                  label="Edit"
                  labelPosition="before"
                  disabled={team.isSystem}
                  primary
                  icon={<CreateIcon />}
                  style={{ marginRight: 10 }}
                  onClick={this.createHandleEditTeam(team.id)}
                />
                <RaisedButton
                  label="Delete"
                  labelPosition="before"
                  disabled={team.isSystem}
                  icon={
                    <DeleteForeverIcon
                      style={{ color: !team.isSystem ? red[500] : undefined }}
                    />
                  }
                  onClick={this.createHandleDeleteTeam(team.id)}
                />
              </TableRowColumn>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
