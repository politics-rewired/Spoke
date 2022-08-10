import { Theme, withStyles } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Paper from "@material-ui/core/Paper";
import DeleteIcon from "@material-ui/icons/Delete";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";
import RestoreFromTrashIcon from "@material-ui/icons/RestoreFromTrash";
import {
  DataGridPro,
  GridColDef,
  GridRenderCellParams
} from "@mui/x-data-grid-pro";
import {
  useEditOrganizationActiveMutation,
  useGetOrganizationsQuery
} from "@spoke/spoke-codegen";
import React, { useState } from "react";

const RedButton = withStyles((theme: Theme) => ({
  root: {
    color: theme.palette.warning.contrastText,
    backgroundColor: theme.palette.warning.main,
    "&:hover": {
      backgroundColor: theme.palette.warning.dark
    }
  }
}))(Button);

const SuperAdminOrganizations: React.FC = (_props) => {
  const {
    data: organizationsData,
    loading,
    refetch: refetchOrganizations
  } = useGetOrganizationsQuery();
  const [organizationIdToEdit, setOrganizationIdToEdit] = useState<
    string | null | undefined
  >();
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [organizationActiveType, setOrganizationActiveType] = useState<
    boolean | null | undefined
  >();
  const [editOrganizationsActiveMutation] = useEditOrganizationActiveMutation();

  const openOrganizationSettings = (organizationId: string) => {
    const url = `${window.BASE_URL}/admin/${organizationId}/settings/general`;
    const newWindow = window.open(url, "_blank", "noopener,noreferrer");
    if (newWindow) newWindow.opener = null;
  };

  const editOrganization = (organizationId: string, active: boolean) => {
    setDialogOpen(true);
    setOrganizationIdToEdit(organizationId);
    setOrganizationActiveType(active);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setOrganizationActiveType(null);
    setOrganizationIdToEdit(null);
  };

  const submitEditOrganization = async () => {
    closeDialog();
    await editOrganizationsActiveMutation({
      variables: {
        organizationId: organizationIdToEdit,
        active: organizationActiveType
      }
    });
    await refetchOrganizations();
  };

  const columns: GridColDef[] = [
    {
      field: "id",
      headerName: "ID",
      flex: 1
    },
    {
      field: "name",
      headerName: "Name",
      flex: 7
    },
    {
      field: "manageOrganization",
      headerName: "Manage",
      sortable: false,
      flex: 3,
      renderCell: (params: GridRenderCellParams) => (
        <Button
          onClick={() => openOrganizationSettings(params.row.id)}
          startIcon={<OpenInNewIcon />}
          color="primary"
          variant="contained"
        >
          Manage
        </Button>
      )
    },
    {
      field: "activateDeactive",
      headerName: "Activate / Deactivate",
      sortable: false,
      flex: 3,
      renderCell: (params: GridRenderCellParams) => (
        <div>
          {params.row.deletedAt ? (
            <Button
              onClick={() => editOrganization(params.row.id, true)}
              startIcon={<RestoreFromTrashIcon />}
              color="primary"
              variant="contained"
            >
              Reactivate
            </Button>
          ) : (
            <RedButton
              onClick={() => editOrganization(params.row.id, false)}
              startIcon={<DeleteIcon />}
              variant="contained"
            >
              Deactivate
            </RedButton>
          )}
        </div>
      )
    }
  ];

  return loading ? (
    <div>Loading...</div>
  ) : (
    <div>
      <Paper>
        <DataGridPro
          disableSelectionOnClick
          autoHeight
          columns={columns}
          rows={organizationsData?.organizations ?? []}
          rowsPerPageOptions={[25]}
          pagination
          pageSize={25}
        />
      </Paper>
      <Dialog open={dialogOpen} onClose={closeDialog}>
        <DialogTitle>
          {organizationActiveType
            ? "Reactivate Organization?"
            : "Deactivate Organization?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to{" "}
            {organizationActiveType ? "reactivate" : "deactivate"} this
            organization?
            {!organizationActiveType && (
              <span>
                <br />
                Deactivating this organization will suspend all current users in
                that organization.
              </span>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button onClick={submitEditOrganization} color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default SuperAdminOrganizations;
