import gql from "graphql-tag";
import { History } from "history";
import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
import FloatingActionButton from "material-ui/FloatingActionButton";
import MenuItem from "material-ui/MenuItem";
import RaisedButton from "material-ui/RaisedButton";
import SelectField from "material-ui/SelectField";
import Snackbar from "material-ui/Snackbar";
import ContentAdd from "material-ui/svg-icons/content/add";
import CreateIcon from "material-ui/svg-icons/content/create";
import SyncIcon from "material-ui/svg-icons/file/cloud-download";
import RefreshIcon from "material-ui/svg-icons/navigation/refresh";
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn
} from "material-ui/Table";
import TextField from "material-ui/TextField";
import moment from "moment";
import React, { Component } from "react";
import { compose } from "react-apollo";
import { withRouter } from "react-router-dom";

import {
  ExternalSystem,
  ExternalSystemInput,
  ExternalSystemType
} from "../api/external-system";
import { RelayPaginatedResponse } from "../api/pagination";
import { MutationMap, QueryMap } from "../network/types";
import theme from "../styles/theme";
import { loadData } from "./hoc/with-operations";

const EXTERNAL_SYSTEM_OPTS: [string, string][] = [["Votebuilder", "VAN"]];

const ACTIONS_COLUMN_INDEX = 3;

interface Props {
  match: any;
  history: History;
  mutations: {
    createExternalSystem: (
      input: ExternalSystemInput
    ) => Promise<{ data: { createExternalSystem: ExternalSystem } }>;
    editExternalSystem: (
      id: string,
      input: ExternalSystemInput
    ) => Promise<{ data: { editExternalSystem: ExternalSystem } }>;
    refreshSystem: (externalSystemId: string) => Promise<{ data: boolean }>;
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
}

class AdminExternalSystems extends Component<Props, State> {
  state: State = {
    editingExternalSystem: undefined,
    externalSystem: {
      name: "",
      type: ExternalSystemType.VAN,
      username: "",
      apiKey: ""
    },
    syncInitiatedForId: undefined
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

  makeHandleRefreshExternalSystem = (systemId: string) => () => {
    this.props.mutations.refreshSystem(systemId);
    this.setState({ syncInitiatedForId: systemId });
  };

  handleDismissSyncSnackbar = (_systemId: string) => async () =>
    this.setState({ syncInitiatedForId: undefined });

  handleRefreshSystems = () => this.props.data.refetch();

  cancelEditingExternalSystem = () =>
    this.setState({ editingExternalSystem: undefined });

  navigateToSystemDetail = (systemId: string) => {
    const { organizationId } = this.props.match.params;
    this.props.history.push(
      `/admin/${organizationId}/integrations/${systemId}`
    );
  };

  saveExternalSystem = async () => {
    const handleError = console.error;

    if (this.state.editingExternalSystem === "new") {
      try {
        const result = await this.props.mutations.createExternalSystem(
          this.state.externalSystem
        );
        this.cancelEditingExternalSystem();
        const systemId = result.data.createExternalSystem.id;
        this.navigateToSystemDetail(systemId);
      } catch (err) {
        handleError(err);
      }
    } else {
      this.props.mutations
        .editExternalSystem(
          this.state.editingExternalSystem!,
          this.state.externalSystem
        )
        .then(this.cancelEditingExternalSystem)
        .catch(handleError);
    }
  };

  editExternalSystemProp = (prop: keyof ExternalSystemInput) => (
    _: unknown,
    newVal: string
  ) =>
    this.setState((prevState) => ({
      externalSystem: { ...prevState.externalSystem, ...{ [prop]: newVal } }
    }));

  handleCellClick = (row: number, columnIndex: number) => {
    if (columnIndex === ACTIONS_COLUMN_INDEX) return;

    const systemId = this.props.data.externalSystems.edges[row].node.id;
    this.navigateToSystemDetail(systemId);
  };

  render() {
    const { externalSystems } = this.props.data;
    const {
      editingExternalSystem,
      externalSystem,
      syncInitiatedForId
    } = this.state;
    const { name, type, username, apiKey } = externalSystem;

    const { edges } = this.props.data.externalSystems;
    const syncingEdge = edges.find(
      (edge) => edge.node.id === syncInitiatedForId
    );
    const syncingSystem = syncingEdge ? syncingEdge.node : undefined;

    return (
      <div>
        <FloatingActionButton
          style={theme.components.floatingButton}
          onClick={this.startCreateExternalSystem}
        >
          <ContentAdd />
        </FloatingActionButton>

        <RaisedButton
          label="Refresh"
          labelPosition="before"
          icon={<RefreshIcon />}
          onClick={this.handleRefreshSystems}
        />

        <Table selectable={false} onCellClick={this.handleCellClick}>
          <TableHeader displaySelectAll={false} enableSelectAll={false}>
            <TableRow>
              {/* Make sure to update ACTIONS_COLUMN_INDEX when changing columns! */}
              <TableHeaderColumn>Name</TableHeaderColumn>
              <TableHeaderColumn>Type</TableHeaderColumn>
              <TableHeaderColumn>Sync Options Last Fetched</TableHeaderColumn>
              <TableHeaderColumn>Actions</TableHeaderColumn>
            </TableRow>
          </TableHeader>
          <TableBody displayRowCheckbox={false} showRowHover>
            {externalSystems.edges.map(({ node: system }) => (
              <TableRow key={system.id}>
                <TableRowColumn>{system.name}</TableRowColumn>
                <TableRowColumn>{system.type}</TableRowColumn>
                <TableRowColumn>
                  {system.syncedAt
                    ? moment(system.syncedAt).fromNow()
                    : "never"}
                </TableRowColumn>
                <TableRowColumn>
                  <RaisedButton
                    label="Edit"
                    labelPosition="before"
                    primary
                    icon={<CreateIcon />}
                    style={{ marginRight: 10 }}
                    onClick={this.makeStartEditExternalSystem(system.id)}
                  />
                  <RaisedButton
                    label="Refresh Sync Options"
                    labelPosition="before"
                    icon={<SyncIcon />}
                    style={{ marginRight: 10 }}
                    onClick={this.makeHandleRefreshExternalSystem(system.id)}
                    disabled={this.state.syncInitiatedForId === system.id}
                  />
                </TableRowColumn>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog
          title={
            editingExternalSystem === "new"
              ? "Create a New Integration"
              : "Edit Integration"
          }
          open={editingExternalSystem !== undefined}
          onRequestClose={this.cancelEditingExternalSystem}
          actions={[
            <FlatButton
              key="cancel"
              label="Cancel"
              onClick={this.cancelEditingExternalSystem}
            />,
            <FlatButton
              key="save"
              label="Save"
              primary
              onClick={this.saveExternalSystem}
            />
          ]}
        >
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
        </Dialog>

        <Snackbar
          open={syncingSystem !== undefined}
          message={
            syncingSystem
              ? `Sync started for ${syncingSystem.name}. Please refresh systems to see updated lists.`
              : ""
          }
          autoHideDuration={4000}
          onRequestClose={
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
