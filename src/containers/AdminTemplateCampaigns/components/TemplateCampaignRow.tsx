import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";
import Chip from "@material-ui/core/Chip";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import IconButton from "@material-ui/core/IconButton";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import { makeStyles } from "@material-ui/core/styles";
import AddIcon from "@material-ui/icons/AddOutlined";
import DeleteIcon from "@material-ui/icons/DeleteOutlined";
import EditIcon from "@material-ui/icons/Edit";
import FileCopyIcon from "@material-ui/icons/FileCopyOutlined";
import MoreVertIcon from "@material-ui/icons/MoreVertOutlined";
import type { TemplateCampaignFragment } from "@spoke/spoke-codegen";
import isEmpty from "lodash/isEmpty";
import type { ReactNode } from "react";
import React, { useCallback, useState } from "react";

import CreateCampaignFromTemplateDialog from "../../../components/CreateCampaignFromTemplateDialog";
import { DateTime } from "../../../lib/datetime";

const useStyles = makeStyles((theme) => ({
  campaignInfo: {
    display: "flex",
    flexWrap: "wrap",
    "& > *": {
      margin: theme.spacing(1)
    }
  }
}));

export interface TemplateCampaignRowProps {
  organizationId: string;
  templateCampaign: TemplateCampaignFragment;
  onClickEdit: () => Promise<void> | void;
  onClickClone: () => Promise<void> | void;
  onClickDelete: () => Promise<void> | void;
}

export const TemplateCampaignRow: React.FC<TemplateCampaignRowProps> = ({
  organizationId,
  templateCampaign,
  onClickEdit,
  onClickClone,
  onClickDelete
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [createFromTemplateOpen, setCreateFromTemplateOpen] = useState<boolean>(
    false
  );
  const [menuAnchor, setMenuAnchor] = useState<HTMLButtonElement | null>(null);

  const classes = useStyles();

  const createdAt = DateTime.fromISO(
    templateCampaign.createdAt
  ).toLocaleString();

  const campaignGroupCount =
    templateCampaign.campaignGroups?.pageInfo.totalCount ?? 0;
  const teamCount = templateCampaign.teams.length;

  const chips: ReactNode[] = [];
  if (campaignGroupCount > 0) {
    chips.push(
      <Chip
        key="campaign-groups"
        label={`${campaignGroupCount} Campaign Groups`}
      />
    );
  }
  if (teamCount > 0) {
    chips.push(<Chip key="teams" label={`${teamCount} Teams`} />);
  }
  if (templateCampaign.isAssignmentLimitedToTeams) {
    chips.push(
      <Chip key="assignment-restriction" label="Assignment Limited to Teams" />
    );
  }

  const handleClickMenu = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) =>
      setMenuAnchor(event.currentTarget),
    [setMenuAnchor]
  );

  const handleCloseMenu = useCallback(() => setMenuAnchor(null), [
    setMenuAnchor
  ]);

  const handleEdit = async () => {
    handleCloseMenu();
    await onClickEdit();
  };

  const handleCopy = async () => {
    handleCloseMenu();
    await onClickClone();
  };

  const handleOpenDelete = async () => {
    handleCloseMenu();
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    await onClickDelete();
    setDeleteDialogOpen(false);
  };

  const handleCreateTemplateClicked = () => {
    setCreateFromTemplateOpen(true);
  };

  return (
    <Card>
      <CardHeader
        title={templateCampaign.title}
        subheader={
          <>
            <span>
              {isEmpty(templateCampaign.description)
                ? "No description"
                : templateCampaign.description}
            </span>
            <br />
            <span>
              Created {createdAt} by {templateCampaign.creator?.displayName}
            </span>
          </>
        }
        action={
          <IconButton
            aria-label="template-campaign-row"
            onClick={handleClickMenu}
          >
            <MoreVertIcon />
          </IconButton>
        }
      />
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon style={{ paddingRight: 15 }} /> Edit Template
          </ListItemIcon>
        </MenuItem>
        <MenuItem onClick={handleCopy}>
          <ListItemIcon>
            <FileCopyIcon style={{ paddingRight: 15 }} /> Copy Template
          </ListItemIcon>
        </MenuItem>
        <MenuItem onClick={handleOpenDelete}>
          <ListItemIcon>
            <DeleteIcon style={{ paddingRight: 15 }} /> Delete Template
          </ListItemIcon>
        </MenuItem>
      </Menu>
      {chips.length > 0 && (
        <CardContent>
          <div className={classes.campaignInfo}>{chips}</div>
        </CardContent>
      )}
      <CardActions>
        <Button
          style={{ marginLeft: "auto" }}
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleCreateTemplateClicked}
        >
          Create From Template
        </Button>
      </CardActions>
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete this template?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this template?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" color="primary" onClick={handleDelete}>
            Delete Template
          </Button>
          <Button
            variant="contained"
            onClick={() => setDeleteDialogOpen(false)}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
      <CreateCampaignFromTemplateDialog
        organizationId={organizationId}
        open={createFromTemplateOpen}
        defaultTemplate={templateCampaign}
        onClose={() => setCreateFromTemplateOpen(false)}
      />
    </Card>
  );
};

export default TemplateCampaignRow;
