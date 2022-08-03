import { createStyles, makeStyles, Theme } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Fab from "@material-ui/core/Fab";
import IconButton from "@material-ui/core/IconButton";
import Paper from "@material-ui/core/Paper";
import AddIcon from "@material-ui/icons/Add";
import DeleteForeverIcon from "@material-ui/icons/DeleteForever";
import {
  DataGridPro,
  GridColDef,
  GridRenderCellParams
} from "@mui/x-data-grid-pro";
import {
  useEditSuperAdminStatusMutation,
  useGetSuperAdminsQuery
} from "@spoke/spoke-codegen";
import React, { useState } from "react";

import AddSuperAdminDialog from "../components/AddSuperAdminDialog";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    fab: {
      position: "absolute",
      bottom: theme.spacing(2),
      right: theme.spacing(2)
    }
  })
);

const SuperAdminSuperAdmin: React.FC = (_props) => {
  const [pageSize, setPageSize] = useState<number>(10);
  const [removeSuperAdminEmail, setRemoveSuperAdminEmail] = useState<
    string | undefined
  >();
  const [addSuperAdminDialog, setAddSuperAdminDialog] = useState<boolean>(
    false
  );
  const [
    confirmRemoveSuperAdminDialog,
    setConfirmRemoveSuperAdminDialog
  ] = useState<boolean>(false);

  const {
    data: superadmins,
    loading,
    refetch: refetchSuperAdmins
  } = useGetSuperAdminsQuery();
  const [editSuperAdminStatus] = useEditSuperAdminStatusMutation();

  const classes = useStyles();

  const handleRemoveSuperadmin = (email: string) => {
    setConfirmRemoveSuperAdminDialog(true);
    setRemoveSuperAdminEmail(email);
  };

  const handleAddSuperAdmin = async (email: string) => {
    await editSuperAdminStatus({
      variables: {
        superAdminStatus: true,
        userEmail: email
      }
    });
    refetchSuperAdmins();
  };

  const handleAddSuperAdminDialog = () => {
    setAddSuperAdminDialog(true);
  };

  const handleConfirmRemoveSuperAdminDialogClose = () => {
    setConfirmRemoveSuperAdminDialog(false);
  };

  const handleConfirmRemoveSuperAdminDialogSubmit = async () => {
    await editSuperAdminStatus({
      variables: {
        superAdminStatus: false,
        userEmail: removeSuperAdminEmail as string
      }
    });
    setConfirmRemoveSuperAdminDialog(false);
    refetchSuperAdmins();
  };

  const handleCloseSuperAdminDialog = () => setAddSuperAdminDialog(false);

  const columns: GridColDef[] = [
    {
      field: "displayName",
      headerName: "Name",
      flex: 4
    },
    {
      field: "email",
      headerName: "Email",
      flex: 4
    },
    {
      field: "removeSuperAdmin",
      headerName: "Remove Superadmin",
      sortable: false,
      flex: 2,
      renderCell: (params: GridRenderCellParams) => (
        <IconButton
          onClick={(event) => {
            event.stopPropagation();
            handleRemoveSuperadmin(params.row.email);
          }}
        >
          <DeleteForeverIcon />
        </IconButton>
      )
    }
  ];
  return loading ? (
    <div>Loading...</div>
  ) : (
    <div>
      <Paper>
        <DataGridPro
          autoHeight
          columns={columns}
          rows={superadmins?.superadmins ?? []}
          pagination
          pageSize={pageSize}
          rowsPerPageOptions={[10, 30, 50]}
          onPageChange={(newPageSize) => setPageSize(newPageSize)}
        />
      </Paper>
      <Fab
        size="large"
        variant="extended"
        color="primary"
        className={classes.fab}
        onClick={handleAddSuperAdminDialog}
      >
        <AddIcon /> Add Superadmin
      </Fab>
      <AddSuperAdminDialog
        open={addSuperAdminDialog}
        onClose={handleCloseSuperAdminDialog}
        onSubmit={handleAddSuperAdmin}
      />
      <Dialog
        open={confirmRemoveSuperAdminDialog}
        onClose={handleConfirmRemoveSuperAdminDialogClose}
      >
        <DialogTitle>Confirm remove superadmin</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove the superadmin?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmRemoveSuperAdminDialogClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmRemoveSuperAdminDialogSubmit}
            color="primary"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default SuperAdminSuperAdmin;
