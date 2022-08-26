import type { Theme } from "@material-ui/core";
import { withStyles } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import Snackbar from "@material-ui/core/Snackbar";
import Alert from "@material-ui/lab/Alert";
import Skeleton from "@material-ui/lab/Skeleton";
import type { GridColDef } from "@mui/x-data-grid-pro";
import { DataGridPro } from "@mui/x-data-grid-pro";
import {
  useBulkOptInMutation,
  useBulkOptOutMutation,
  useGetOptOutsByCampaignForOrganizationQuery
} from "@spoke/spoke-codegen";
import React, { useState } from "react";

import OptionsDialog from "./components/OptionsDialog";
import type { BulkOptParams } from "./components/types";
import { DialogMode } from "./components/types";

const RedButton = withStyles((theme: Theme) => ({
  root: {
    color: theme.palette.warning.contrastText,
    backgroundColor: theme.palette.warning.main,
    "&:hover": {
      backgroundColor: theme.palette.warning.dark
    }
  }
}))(Button);

const AdminOptOutList: React.FC = (props) => {
  const [pageSize, setPageSize] = useState<number>(10);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>(DialogMode.None);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);

  const { organizationId } = props.match.params;

  const {
    data: optOutsData,
    loading,
    refetch: refetchOptOuts
  } = useGetOptOutsByCampaignForOrganizationQuery({
    variables: {
      organizationId
    }
  });
  const [bulkOptOut] = useBulkOptOutMutation();
  const [bulkOptIn] = useBulkOptInMutation();

  const handleDismissAlert = () => setSnackbarOpen(false);

  const handleSubmit = async ({ csvFile, numbersList }: BulkOptParams) => {
    const variables = {
      organizationId,
      csvFile,
      numbersList
    };
    setSnackbarOpen(true);
    switch (dialogMode) {
      case DialogMode.OptIn:
        await bulkOptIn({ variables });
        break;
      case DialogMode.OptOut:
        await bulkOptOut({ variables });
        break;
      default:
        return "";
    }
    await refetchOptOuts();
  };

  const optOuts = optOutsData?.optOuts ?? [];

  const columns: GridColDef[] = [
    {
      field: "title",
      headerName: "Campaign Name",
      flex: 3
    },
    {
      field: "count",
      headerName: "Opt Outs Count",
      flex: 1
    }
  ];

  const handleClose = () => {
    setDialogOpen(false);
  };

  const handleClickOptOut = () => {
    setDialogMode(DialogMode.OptOut);
    setDialogOpen(true);
  };

  const handleClickOptIn = () => {
    setDialogMode(DialogMode.OptIn);
    setDialogOpen(true);
  };

  const alertText = () => {
    switch (dialogMode) {
      case DialogMode.OptIn:
        return "Processing Opt Ins...";
      case DialogMode.OptOut:
        return "Processing Opt Outs";
      default:
        return "";
    }
  };

  if (loading) {
    return <Skeleton variant="rect" width="600" height="300" />;
  }

  return (
    <div>
      <Grid
        container
        justify="flex-end"
        style={{ marginTop: 15, marginBottom: 15 }}
      >
        <Grid item style={{ marginRight: 20 }}>
          <RedButton variant="contained" onClick={handleClickOptOut}>
            Import Opt Outs
          </RedButton>
        </Grid>
        <Grid item>
          <Button
            color="primary"
            variant="contained"
            onClick={handleClickOptIn}
          >
            Import Opt Ins
          </Button>
        </Grid>
      </Grid>
      <Paper>
        <DataGridPro
          autoHeight
          pagination
          pageSize={pageSize}
          onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
          rowsPerPageOptions={[10, 30, 50, 100, 500, 1000, 2000]}
          loading={loading}
          columns={columns}
          rows={optOuts}
        />
      </Paper>
      <OptionsDialog
        open={dialogOpen}
        dialogMode={dialogMode}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleDismissAlert}
      >
        <Alert onClose={handleDismissAlert} severity="success">
          {alertText()}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default AdminOptOutList;
