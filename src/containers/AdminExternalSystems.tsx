import type { ApolloQueryResult } from "@apollo/client";
import { gql } from "@apollo/client";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import Fab from "@material-ui/core/Fab";
import Paper from "@material-ui/core/Paper";
import Snackbar from "@material-ui/core/Snackbar";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import AddIcon from "@material-ui/icons/Add";
import CloudDownloadIcon from "@material-ui/icons/CloudDownload";
import CreateIcon from "@material-ui/icons/Create";
import RefreshIcon from "@material-ui/icons/Refresh";
import type { ExternalSystem, ExternalSystemInput } from "@spoke/spoke-codegen";
import type { History } from "history";
import MenuItem from "material-ui/MenuItem";
import SelectField from "material-ui/SelectField";
import TextField from "material-ui/TextField";
import React, { Component } from "react";
import { Link, withRouter } from "react-router-dom";
import { compose } from "recompose";

import { ExternalSystemType, VanOperationMode } from "../api/external-system";
import { DateTime } from "../lib/datetime";
import type { MutationMap, QueryMap } from "../network/types";
import theme from "../styles/theme";
import { loadData } from "./hoc/with-operations";

const EXTERNAL_SYSTEM_OPTS: [string, string][] = [["Votebuilder", "VAN"]];
const OPERATION_MODE_OPTS: [string, string][] = [
  ["Voterfile", VanOperationMode.VOTERFILE],
  ["MyCampaign", VanOperationMode.MYCAMPAIGN]
];

interface Props {
  match: any;
  history: History;
  mutations: {
    createExternalSystem: (
      input: ExternalSystemInput
    ) => Promise<ApolloQueryResult<{ createExternalSystem: ExternalSystem }>>;
    editExternalSystem: (
      id: string,
      input: ExternalSystemInput
    ) => Promise<ApolloQueryResult<{ editExternalSystem: ExternalSystem }>>;
    refreshSystem: (
      externalSystemId: string
    ) => Promise<ApolloQueryResult<boolean>>;
  };
  data: {
    externalSystems: RelayPaginatedResponse<ExternalSystem>;
    refetch(): void;
  };
}

interface State {
  editingExternalSystem: "new" | string | undefined;
  externalSystem: ExternalSystemInput;
  syncInitiatedForId?: string;
  error: string | undefined;
}

class AdminExternalSystems extends Component<Props, State> {
  state: State = {
    editingExternalSystem: undefined,
    externalSystem: {
      name: "",
      type: ExternalSystemType.VAN,
      username: "",
      apiKey: "",
      operationMode: VanOperationMode.VOTERFILE
    },
    syncInitiatedForId: undefined,
    error: undefined
  };

  startCreateExternalSystem = () =>
    this.setState({ editingExternalSystem: "new" });

  makeStartEditExternalSystem = (systemId: string) => () => {
    const { edges } = this.props.data.externalSystems;
    const system = edges.find((edge) => edge.node.id === systemId)!.node;

    const { id: _id, syncedAt: _syncedAt, ...externalSystem } = system;
    this.setState({
      editingExternalSystem: systemId,
      externalSystem
    });
  };

  makeHandleRefreshExternalSystem = (systemId: string) => async () => {
    try {
      const response = await this.props.mutations.refreshSystem(systemId);
      if (response.errors) throw response.errors[0];
    } catch (err: any) {
      this.setState({ error: err.message });
    } finally {
      this.setState({ syncInitiatedForId: systemId });
    }
  };

  handleDismissSyncSnackbar = (_systemId: string) => async () =>
    this.setState({ syncInitiatedForId: undefined });

  handleRefreshSystems = () => this.props.data.refetch();

  cancelEditingExternalSystem = () =>
    this.setState({
      editingExternalSystem: undefined,
      externalSystem: {
        name: "",
        type: ExternalSystemType.VAN,
        username: "",
        apiKey: "",
        operationMode: VanOperationMode.VOTERFILE
      }
    });

  saveExternalSystem = async () => {
    const { editingExternalSystem, externalSystem } = this.state;
    try {
      const response =
        editingExternalSystem === "new"
          ? await this.props.mutations.createExternalSystem(externalSystem)
          : await this.props.mutations.editExternalSystem(
              editingExternalSystem!,
              externalSystem
            );
      if (response.errors) throw response.errors[0];
    } catch (err: any) {
      this.setState({ error: err.message });
    } finally {
      this.cancelEditingExternalSystem();
    }
  };

  editExternalSystemProp = (prop: keyof ExternalSystemInput) => (
    _: unknown,
    newVal: string
  ) =>
    this.setState((prevState) => ({
      externalSystem: { ...prevState.externalSystem, ...{ [prop]: newVal } }
    }));

  handleSelectOperationMode = (
    _event: any,
    _index: number,
    newOperationMode: VanOperationMode
  ) => {
    const { externalSystem } = this.state;
    this.setState({
      externalSystem: { ...externalSystem, operationMode: newOperationMode }
    });
  };

  handleCancelError = () => {
    this.setState({ error: undefined });
  };

  render() {
    const { externalSystems } = this.props.data;
    const {
      editingExternalSystem,
      externalSystem,
      syncInitiatedForId,
      error
    } = this.state;
    const { name, type, username, apiKey, operationMode } = externalSystem;

    const { edges } = this.props.data.externalSystems;
    const syncingEdge = edges.find(
      (edge) => edge.node.id === syncInitiatedForId
    );
    const syncingSystem = syncingEdge ? syncingEdge.node : undefined;

    const errorActions = [
      <Button key="ok" color="primary" onClick={this.handleCancelError}>
        Ok
      </Button>
    ];

    const { organizationId } = this.props.match.params;

    return (
      <div>
        <Fab
          color="primary"
          style={theme.components.floatingButton}
          onClick={this.startCreateExternalSystem}
        >
          <AddIcon />
        </Fab>

        <Button
          variant="contained"
          endIcon={<RefreshIcon />}
          onClick={this.handleRefreshSystems}
          style={{ marginTop: 15, marginBottom: 15 }}
        >
          Refresh List
        </Button>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                {/* Make sure to update ACTIONS_COLUMN_INDEX when changing columns! */}
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Sync Options Last Fetched</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {externalSystems.edges.map(({ node: system }) => {
                const detailURL = `/admin/${organizationId}/integrations/${system.id}`;
                return (
                  <TableRow key={system.id} hover>
                    <TableCell>
                      <Link to={detailURL}>{system.name}</Link>
                    </TableCell>
                    <TableCell>{system.type}</TableCell>
                    <TableCell>
                      {system.syncedAt
                        ? DateTime.fromISO(system.syncedAt).toRelative()
                        : "never"}
                    </TableCell>
                    <TableCell style={{ textOverflow: "clip" }}>
                      <Button
                        variant="contained"
                        color="primary"
                        endIcon={<CreateIcon />}
                        style={{ marginRight: 10 }}
                        onClick={this.makeStartEditExternalSystem(system.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="contained"
                        endIcon={<CloudDownloadIcon />}
                        style={{ marginRight: 10 }}
                        disabled={this.state.syncInitiatedForId === system.id}
                        onClick={this.makeHandleRefreshExternalSystem(
                          system.id
                        )}
                      >
                        Sync
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog
          open={editingExternalSystem !== undefined}
          onClose={this.cancelEditingExternalSystem}
        >
          <DialogTitle>
            {editingExternalSystem === "new"
              ? "Create a New Integration"
              : "Edit Integration"}
          </DialogTitle>
          <DialogContent>
            <TextField
              name="name"
              floatingLabelText="Integration Name"
              fullWidth
              value={name}
              onChange={this.editExternalSystemProp("name")}
            />
            <br />
            <SelectField floatingLabelText="System Type" value={type} fullWidth>
              {EXTERNAL_SYSTEM_OPTS.map(([display, val]) => (
                <MenuItem key={val} value={val} primaryText={display} />
              ))}
            </SelectField>
            {type === "VAN" && (
              <SelectField
                floatingLabelText="VAN Operation Mode"
                fullWidth
                value={operationMode}
                onChange={this.handleSelectOperationMode}
              >
                {OPERATION_MODE_OPTS.map(([display, val]) => (
                  <MenuItem key={val} value={val} primaryText={display} />
                ))}
              </SelectField>
            )}
            <br />
            <TextField
              name="username"
              floatingLabelText="Username"
              fullWidth
              value={username}
              onChange={this.editExternalSystemProp("username")}
            />
            <br />
            <TextField
              name="apiKey"
              floatingLabelText="API Key"
              fullWidth
              value={apiKey}
              onChange={this.editExternalSystemProp("apiKey")}
            />
          </DialogContent>
          <DialogActions>
            <Button key="cancel" onClick={this.cancelEditingExternalSystem}>
              Cancel
            </Button>
            <Button
              key="save"
              color="primary"
              onClick={this.saveExternalSystem}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog open={error !== undefined} onClose={this.handleCancelError}>
          <DialogTitle>Integrations Error</DialogTitle>
          <DialogContent>
            <DialogContentText>{error || ""}</DialogContentText>
          </DialogContent>
          <DialogActions>{errorActions}</DialogActions>
        </Dialog>

        <Snackbar
          open={syncingSystem !== undefined}
          message={
            syncingSystem
              ? `Sync started for ${syncingSystem.name}. Please refresh systems to see updated lists.`
              : ""
          }
          autoHideDuration={4000}
          onClose={
            syncingSystem
              ? this.handleDismissSyncSnackbar(syncingSystem.id)
              : undefined
          }
        />
      </div>
    );
  }
}

const queries: QueryMap<Props> = {
  data: {
    query: gql`
      query getExternalSystems($organizationId: String!) {
        externalSystems(organizationId: $organizationId) {
          edges {
            node {
              id
              name
              type
              username
              apiKey
              syncedAt
              operationMode
            }
          }
        }
      }
    `,
    options: (ownProps) => ({
      variables: {
        organizationId: ownProps.match.params.organizationId
      }
    })
  }
};

const mutations: MutationMap<Props> = {
  createExternalSystem: (ownProps) => (
    externalSystem: ExternalSystemInput
  ) => ({
    mutation: gql`
      mutation createExternalSystem(
        $organizationId: String!
        $externalSystem: ExternalSystemInput!
      ) {
        createExternalSystem(
          organizationId: $organizationId
          externalSystem: $externalSystem
        ) {
          id
          name
          type
          username
          apiKey
          createdAt
          updatedAt
          operationMode
        }
      }
    `,
    variables: {
      organizationId: ownProps.match.params.organizationId,
      externalSystem
    },
    refetchQueries: ["getExternalSystems"]
  }),
  editExternalSystem: (_ownProps) => (
    id: string,
    externalSystem: ExternalSystemInput
  ) => ({
    mutation: gql`
      mutation editExternalSystem(
        $id: String!
        $externalSystem: ExternalSystemInput!
      ) {
        editExternalSystem(id: $id, externalSystem: $externalSystem) {
          id
          name
          type
          username
          apiKey
          operationMode
        }
      }
    `,
    variables: {
      id,
      externalSystem
    }
  }),
  refreshSystem: (_ownProps) => (externalSystemId: string) => ({
    mutation: gql`
      mutation refreshExternalSystem($externalSystemId: String!) {
        refreshExternalSystem(externalSystemId: $externalSystemId)
      }
    `,
    variables: {
      externalSystemId
    }
  })
};

export default compose(
  withRouter,
  loadData({
    queries,
    mutations
  })
)(AdminExternalSystems);
