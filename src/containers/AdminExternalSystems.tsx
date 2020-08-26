import React, { Component } from "react";
import moment from "moment";
import gql from "graphql-tag";

import {
  Table,
  TableHeader,
  TableHeaderColumn,
  TableBody,
  TableRow,
  TableRowColumn
} from "material-ui/Table";
import FloatingActionButton from "material-ui/FloatingActionButton";
import SelectField from "material-ui/SelectField";
import MenuItem from "material-ui/MenuItem";
import RaisedButton from "material-ui/RaisedButton";
import FlatButton from "material-ui/FlatButton";
import Dialog from "material-ui/Dialog";
import TextField from "material-ui/TextField";
import Snackbar from "material-ui/Snackbar";
import ContentAdd from "material-ui/svg-icons/content/add";
import CreateIcon from "material-ui/svg-icons/content/create";
import RefreshIcon from "material-ui/svg-icons/navigation/refresh";
import SyncIcon from "material-ui/svg-icons/file/cloud-download";

import { loadData } from "./hoc/with-operations";
import {
  ExternalSystemType,
  ExternalSystem,
  ExternalSystemInput
} from "../api/external-system";
import { RelayPaginatedResponse } from "../api/pagination";
import theme from "../styles/theme";

const EXTERNAL_SYSTEM_OPTS: [string, string][] = [["Votebuilder", "VAN"]];

interface Props {
  match: any;
  mutations: {
    createExternalSystem: (
      input: ExternalSystemInput
    ) => Promise<{ data: { createExternalSystem: ExternalSystem } }>;
    editExternalSystem: (
      id: string,
      input: ExternalSystemInput
    ) => Promise<{ data: { editExternalSystem: ExternalSystem } }>;
    refreshSystem: (externalSystemId: string) => Promise<{ data: Boolean }>;
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
    const system = edges.find(edge => edge.node.id === systemId)!.node;

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

  handleDismissSyncSnackbar = (systemId: string) => async () =>
    this.setState({ syncInitiatedForId: undefined });

  handleRefreshSystems = () => this.props.data.refetch();

  cancelEditingExternalSystem = () =>
    this.setState({ editingExternalSystem: undefined });

  saveExternalSystem = () => {
    const handleError = console.error;

    this.state.editingExternalSystem === "new"
      ? this.props.mutations
          .createExternalSystem(this.state.externalSystem)
          .then(this.cancelEditingExternalSystem)
          .catch(handleError)
      : this.props.mutations
          .editExternalSystem(
            this.state.editingExternalSystem!,
            this.state.externalSystem
          )
          .then(this.cancelEditingExternalSystem)
          .catch(handleError);
  };

  editExternalSystemProp = (prop: keyof ExternalSystemInput) => (
    _: unknown,
    newVal: string
  ) =>
    this.setState(prevState => ({
      externalSystem: { ...prevState.externalSystem, ...{ [prop]: newVal } }
    }));

  render() {
    const { externalSystems } = this.props.data;
    const {
      editingExternalSystem,
      externalSystem,
      syncInitiatedForId
    } = this.state;
    const { name, type, username, apiKey } = externalSystem;

    const { edges } = this.props.data.externalSystems;
    const syncingEdge = edges.find(edge => edge.node.id === syncInitiatedForId);
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

        <Table selectable={false}>
          <TableHeader displaySelectAll={false} enableSelectAll={false}>
            <TableRow>
              <TableHeaderColumn>Name</TableHeaderColumn>
              <TableHeaderColumn>Type</TableHeaderColumn>
              <TableHeaderColumn>Resources Last Fetched</TableHeaderColumn>
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
                    primary={true}
                    icon={<CreateIcon />}
                    style={{ marginRight: 10 }}
                    onClick={this.makeStartEditExternalSystem(system.id)}
                  />
                  <RaisedButton
                    label="Get Resources"
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
              label="Cancel"
              onClick={this.cancelEditingExternalSystem}
            />,
            <FlatButton
              label="Save"
              primary={true}
              onClick={this.saveExternalSystem}
            />
          ]}
        >
          <TextField
            name="name"
            floatingLabelText="Integration Name"
            fullWidth={true}
            value={name}
            onChange={this.editExternalSystemProp("name")}
          />
          <br />
          <SelectField
            floatingLabelText="System Type"
            value={type}
            fullWidth={true}
          >
            {EXTERNAL_SYSTEM_OPTS.map(([display, val]) => (
              <MenuItem key={val} value={val} primaryText={display} />
            ))}
          </SelectField>
          <br />
          <TextField
            name="username"
            floatingLabelText="Username"
            fullWidth={true}
            value={username}
            onChange={this.editExternalSystemProp("username")}
          />
          <br />
          <TextField
            name="apiKey"
            floatingLabelText="API Key"
            fullWidth={true}
            value={apiKey}
            onChange={this.editExternalSystemProp("apiKey")}
          />
        </Dialog>

        <Snackbar
          open={syncingSystem !== undefined}
          message={
            syncingSystem
              ? `Sync started for ${
                  syncingSystem.name
                }. Please refresh systems to see updated lists.`
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

const queries = {
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
    options: (ownProps: Props) => ({
      variables: {
        organizationId: ownProps.match.params.organizationId
      }
    })
  }
};

const mutations = {
  createExternalSystem: (ownProps: Props) => (
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
  editExternalSystem: (ownProps: Props) => (
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
      id: id,
      externalSystem
    }
  }),
  refreshSystem: (ownProps: Props) => (externalSystemId: string) => ({
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

export default loadData({
  queries,
  mutations
})(AdminExternalSystems);
