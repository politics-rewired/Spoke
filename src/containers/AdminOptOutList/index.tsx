import type { Theme } from "@material-ui/core";
import { withStyles } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardHeader from "@material-ui/core/CardHeader";
import Collapse from "@material-ui/core/Collapse";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import Paper from "@material-ui/core/Paper";
import Snackbar from "@material-ui/core/Snackbar";
import TextField from "@material-ui/core/TextField";
import ClearIcon from "@material-ui/icons/Clear";
import ExpandLess from "@material-ui/icons/ExpandLess";
import ExpandMore from "@material-ui/icons/ExpandMore";
import SearchIcon from "@material-ui/icons/Search";
import Alert from "@material-ui/lab/Alert";
import type { GridColDef, GridSelectionModel } from "@mui/x-data-grid-pro";
import { DataGridPro } from "@mui/x-data-grid-pro";
import {
  useBulkOptInMutation,
  useBulkOptOutMutation,
  useExportOptOutsMutation,
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

interface QuickSearchToolbarProps {
  value: string;
  onChange(): void;
  clearSearch(): void;
}

const QuickSearchToolbar: React.FC<QuickSearchToolbarProps> = (props) => {
  return (
    <div
      style={{
        justifyContent: "flex-end",
        paddingTop: 15,
        paddingRight: 15,
        paddingBottom: 5,
        display: "flex"
      }}
    >
      <TextField
        style={{ width: 400 }}
        variant="standard"
        value={props.value}
        onChange={props.onChange}
        placeholder="Search…"
        InputProps={{
          startAdornment: <SearchIcon />,
          endAdornment: (
            <IconButton
              title="Clear"
              aria-label="Clear"
              size="small"
              style={{ visibility: props.value ? "visible" : "hidden" }}
              onClick={props.clearSearch}
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          )
        }}
      />
    </div>
  );
};

const AdminOptOutList: React.FC = (props) => {
  const [pageSize, setPageSize] = useState<number>(10);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>(DialogMode.None);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [showSection, setShowSection] = useState<boolean>(false);
  const [exportingOptOuts, setExportingOptOuts] = useState<boolean>(false);
  const [searchText, setSearchText] = React.useState("");
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<Array<string>>(
    []
  );

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
  const [exportOptOuts] = useExportOptOutsMutation();

  const handleDismissAlert = () => {
    setSnackbarOpen(false);
    setExportingOptOuts(false);
    setDialogMode(DialogMode.None);
  };

  const handleExpandChange = () => setShowSection(!showSection);

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

  const handleRowsSelected = (rowsSelected: GridSelectionModel) => {
    setSelectedCampaignIds(rowsSelected as string[]);
  };

  const handleExportAll = async () => {
    setExportingOptOuts(true);
    setSnackbarOpen(true);
    await exportOptOuts({
      variables: {
        organizationId
      }
    });
  };

  const handleExportSelected = async () => {
    setExportingOptOuts(true);
    setSnackbarOpen(true);
    await exportOptOuts({
      variables: {
        organizationId,
        campaignIds: selectedCampaignIds
      }
    });
  };

  const alertText = () => {
    if (exportingOptOuts)
      return "Exporting Opt Outs. The file will be emailed to you...";
    switch (dialogMode) {
      case DialogMode.OptIn:
        return "Processing Opt Ins...";
      case DialogMode.OptOut:
        return "Processing Opt Outs";
      default:
        return "";
    }
  };

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
      <Card style={{ marginTop: 15, marginBottom: 15 }}>
        <CardHeader
          title="Export Opt Outs"
          action={
            <IconButton>
              {showSection ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          }
          style={{ cursor: "pointer" }}
          onClick={handleExpandChange}
        />
        <Collapse in={showSection}>
          <CardContent>
            <ButtonGroup fullWidth variant="contained" color="primary">
              <Button onClick={handleExportAll}>Export All</Button>
              <Button
                onClick={handleExportSelected}
                disabled={selectedCampaignIds.length === 0}
              >
                Export Selected ({selectedCampaignIds.length} Selected)
              </Button>
            </ButtonGroup>
          </CardContent>
        </Collapse>
      </Card>
      <Paper>
        <DataGridPro
          autoHeight
          pagination
          checkboxSelection
          onSelectionModelChange={handleRowsSelected}
          pageSize={pageSize}
          onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
          rowsPerPageOptions={[10, 30, 50, 100, 500, 1000, 2000]}
          loading={loading}
          columns={columns}
          rows={optOuts}
          filterModel={{
            items: [
              {
                id: 1,
                columnField: "title",
                operatorValue: "contains",
                value: searchText
              }
            ]
          }}
          components={{ Toolbar: QuickSearchToolbar }}
          componentsProps={{
            toolbar: {
              value: searchText,
              onChange: (event: React.ChangeEvent<{ value: unknown }>) =>
                setSearchText(event.target.value as string),
              clearSearch: () => setSearchText("")
            }
          }}
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
