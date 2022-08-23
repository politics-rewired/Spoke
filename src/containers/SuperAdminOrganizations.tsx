import { Theme, withStyles } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Paper from "@material-ui/core/Paper";
import Select from "@material-ui/core/Select";
import Tooltip from "@material-ui/core/Tooltip";
import Typography from "@material-ui/core/Typography";
import DeleteIcon from "@material-ui/icons/Delete";
import OpenInNewIcon from "@material-ui/icons/OpenInNew";
import RestoreFromTrashIcon from "@material-ui/icons/RestoreFromTrash";
import Skeleton from "@material-ui/lab/Skeleton";
import {
  DataGridPro,
  GridColDef,
  GridRenderCellParams
} from "@mui/x-data-grid-pro";
import {
  DeactivateMode,
  Organization,
  useEditOrganizationActiveMutation,
  useGetOrganizationsQuery
} from "@spoke/spoke-codegen";
import isNil from "lodash/isNil";
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
  const [organizationDeactivateMode, setOrganizationDeactivateMode] = useState<
    DeactivateMode
  >(DeactivateMode.Nosuspend);
  const [organizationActiveEdit, setOrganizationActiveEdit] = useState<
    boolean | null | undefined
  >();
  const [editOrganizationsActiveMutation] = useEditOrganizationActiveMutation();

  const organizations = organizationsData?.organizations ?? [];
  const organization = organizationIdToEdit
    ? organizations.find((o) => o?.id === organizationIdToEdit)
    : ({} as Organization);

  // Use noopener, and make newWindow.opener null to avoid security flaw
  // Details here:
  // https://www.jitbit.com/alexblog/256-targetblank---the-most-underestimated-vulnerability-ever/
  const openOrganizationSettings = (organizationId: string) => {
    const url = `${window.BASE_URL}/admin/${organizationId}/settings/general`;
    const newWindow = window.open(url, "_blank", "noopener,noreferrer");
    if (newWindow) newWindow.opener = null;
  };

  const handleDeactivateModeChange = (
    event: React.ChangeEvent<{ value: DeactivateMode }>
  ) => {
    setOrganizationDeactivateMode(event.target.value);
  };

  const editOrganization = (organizationId: string, active: boolean) => {
    setOrganizationIdToEdit(organizationId);
    setOrganizationActiveEdit(active);
  };

  const closeDialog = () => {
    setOrganizationActiveEdit(null);
    setOrganizationIdToEdit(null);
  };

  const submitEditOrganization = async () => {
    closeDialog();
    await editOrganizationsActiveMutation({
      variables: {
        organizationId: organizationIdToEdit,
        active: organizationActiveEdit,
        deactivateMode: organizationDeactivateMode
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

  if (loading) {
    return <Skeleton variant="rect" width="800" height="200" />;
  }
  return (
    <div>
      <Paper>
        <DataGridPro
          disableSelectionOnClick
          autoHeight
          columns={columns}
          rows={organizations}
          rowsPerPageOptions={[25]}
          pagination
          pageSize={25}
        />
      </Paper>
      <Dialog open={!isNil(organizationIdToEdit)} onClose={closeDialog}>
        <DialogTitle>
          {organizationActiveEdit
            ? "Reactivate Organization?"
            : "Deactivate Organization?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to{" "}
            {organizationActiveEdit ? "reactivate" : "deactivate"} this
            organization ({organization?.name ?? ""})?
            {!organizationActiveEdit && (
              <div>
                <br />
                <br />
                You will continue to be billed for inbound messages to
                deactivated organizations. If you plan to permanently shut down
                the organization (and avoid further costs), you can submit a
                ticket to support@spokerewired.com letting us know.
                <FormControl style={{ marginTop: 10 }}>
                  <InputLabel id="select-deactivate-mode">
                    Suspend Users?
                  </InputLabel>
                  <Select
                    style={{ width: 500 }}
                    labelId="select-deactivate-mode"
                    value={organizationDeactivateMode}
                    onChange={handleDeactivateModeChange}
                  >
                    <Tooltip
                      placement="top"
                      value={DeactivateMode.Nosuspend}
                      key={DeactivateMode.Nosuspend}
                      title={
                        <Typography variant="subtitle1">
                          Unsuspended users may be able to navigate to the
                          organization directly. The organization will not
                          appear on users' organization list.
                        </Typography>
                      }
                    >
                      <MenuItem>Don't suspend / delete users</MenuItem>
                    </Tooltip>
                    <Tooltip
                      placement="top"
                      key={DeactivateMode.Suspendall}
                      value={DeactivateMode.Suspendall}
                      title={
                        <Typography variant="subtitle1">
                          {" "}
                          Users who were suspended as part of shutdown can
                          optionally be unsuspended upon reactivation of the
                          organization.
                        </Typography>
                      }
                    >
                      <MenuItem>Suspend all users except owners</MenuItem>
                    </Tooltip>
                    <Tooltip
                      placement="top"
                      key={DeactivateMode.Deleteall}
                      value={DeactivateMode.Deleteall}
                      title={
                        <Typography variant="subtitle1">
                          User records will be deleted. Deleted users cannot be
                          reinstated upon reactivation of the organization.
                          Users will need to be sent a join link to rejoin the
                          organization.
                          <br />
                          <br />
                          This option should be used to fully shut down the
                          organization and trigger the release of phone numbers
                          and finalized billing for the organization. Owners who
                          want to select the first two options but also not be
                          billed for inbounds can send an email requesting that
                          phone numbers be sold.
                        </Typography>
                      }
                    >
                      <MenuItem>
                        Delete all users (including owners) and shut down
                        organization
                      </MenuItem>
                    </Tooltip>
                  </Select>
                </FormControl>
              </div>
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
