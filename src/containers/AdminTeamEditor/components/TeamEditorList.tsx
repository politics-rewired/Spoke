import Button from "@material-ui/core/Button";
import Paper from "@material-ui/core/Paper";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import CreateIcon from "@material-ui/icons/Create";
import DeleteForeverIcon from "@material-ui/icons/DeleteForever";
import type { Team } from "@spoke/spoke-codegen";
import React from "react";
import { Link, withRouter } from "react-router-dom";

export interface TeamEditorListProps {
  organizationId: string;
  teams: Team[];
  onEditTeam: (teamId: string) => Promise<void> | void;
  onDeleteTeam: (teamId: string) => Promise<void> | void;
}

const TeamEditorList: React.FC<TeamEditorListProps> = (props) => {
  const { teams, organizationId } = props;

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
          {teams.map((team) => {
            const teamURL = `/admin/${organizationId}/teams/${team.id}`;
            return (
              <TableRow key={team.id} hover>
                <TableCell>{team.assignmentPriority}</TableCell>
                <TableCell>
                  <Link to={teamURL}>{team.title}</Link>
                </TableCell>
                <TableCell>{team.description}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="primary"
                    endIcon={<CreateIcon />}
                    style={{ marginRight: 10 }}
                    onClick={() => props.onEditTeam(team.id)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="contained"
                    endIcon={<DeleteForeverIcon />}
                    onClick={() => props.onDeleteTeam(team.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default withRouter(TeamEditorList);
