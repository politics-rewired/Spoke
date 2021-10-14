import IconButton from "@material-ui/core/IconButton";
import Paper from "@material-ui/core/Paper";
import { makeStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";
import React from "react";

import { CampaignGroup } from "../../api/campaign-group";

const useStyles = makeStyles({
  table: {
    minWidth: 650
  }
});

export interface AdminCampaignGroupListProps {
  campaignGroups: CampaignGroup[];
  onEditGroup: (groupId: string) => Promise<void> | void;
  onDeleteGroup: (groupId: string) => Promise<void> | void;
}

export const AdminCampaignGroupList: React.FC<AdminCampaignGroupListProps> = (
  props
) => {
  const classes = useStyles();

  const handleClickEditFactory = (groupId: string) => () =>
    props.onEditGroup(groupId);
  const handleClickDeleteFactory = (groupId: string) => () =>
    props.onDeleteGroup(groupId);

  return (
    <TableContainer component={Paper}>
      <Table className={classes.table} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell align="right">Description</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {props.campaignGroups.map((campaignGroup) => (
            <TableRow key={campaignGroup.name}>
              <TableCell component="th" scope="row">
                {campaignGroup.name}
              </TableCell>
              <TableCell align="right">{campaignGroup.description}</TableCell>
              <TableCell align="right">
                <IconButton
                  aria-label="edit"
                  onClick={handleClickEditFactory(campaignGroup.id)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  aria-label="delete"
                  onClick={handleClickDeleteFactory(campaignGroup.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default AdminCampaignGroupList;
