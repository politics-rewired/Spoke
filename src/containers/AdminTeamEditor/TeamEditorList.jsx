import React, { Component } from "react";
import PropTypes from "prop-types";

import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn
} from "material-ui/Table";
import RaisedButton from "material-ui/RaisedButton";
import CreateIcon from "material-ui/svg-icons/content/create";
import DeleteForeverIcon from "material-ui/svg-icons/action/delete-forever";
import { red500 } from "material-ui/styles/colors";

class TeamEditorList extends Component {
  createHandleEditTeam = teamId => () => this.props.oEditTeam(teamId);
  createHandleDeleteTeam = teamId => () => this.props.onDeleteTeam(teamId);

  render() {
    const { teams } = this.props;

    return (
      <Table selectable={false} multiSelectable={false}>
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
        <TableBody displayRowCheckbox={false}>
          {teams.map(team => (
            <TableRow key={team.id} selectable={false}>
              <TableRowColumn>{team.assignmentPriority}</TableRowColumn>
              <TableRowColumn>{team.title}</TableRowColumn>
              <TableRowColumn>{team.description}</TableRowColumn>
              <TableRowColumn>
                <RaisedButton
                  label="Edit"
                  labelPosition="before"
                  disabled={team.isSystem}
                  primary={true}
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
                      color={!team.isSystem ? red500 : undefined}
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
  teams: PropTypes.arrayOf(PropTypes.object).isRequired,
  oEditTeam: PropTypes.func.isRequired,
  onDeleteTeam: PropTypes.func.isRequired
};

export default TeamEditorList;
