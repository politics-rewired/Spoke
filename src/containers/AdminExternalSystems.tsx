import React, { Component } from "react";
import { withOperations } from "./hoc/with-operations";
import gql from "graphql-tag";
import { RaisedButton, SelectField, MenuItem } from "material-ui";
import CreateIcon from "material-ui/svg-icons/content/create";
import Dialog from "material-ui/Dialog";
import TextField from "material-ui/TextField";
import Paper from "material-ui/Paper";
import Chip from "material-ui/Chip";
import FlatButton from "material-ui/FlatButton";
// import pick from "lodash/pick";

// import FloatingActionButton from "material-ui/FloatingActionButton";
// import Dialog from "material-ui/Dialog";
// import TextField from "material-ui/TextField";
// import Toggle from "material-ui/Toggle";
// import ContentAddIcon from "material-ui/svg-icons/content/add";

// import LoadingIndicator from "../../components/LoadingIndicator";
// import TagEditorList from "./TagEditorList";
// import theme from "../../styles/theme";

const EXTERNAL_SYSTEM_OPTS: [string, string][] = [["Votebuilder", "VAN"]];

const styles = {
  wrapper: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "flex-start"
  },
  card: {
    margin: 10,
    padding: 10
  },
  chip: {
    marginRight: "auto",
    color: "#000000"
  },
  description: {
    maxWidth: "200px"
  }
};

interface ExternalSystem {
  id: string;
  name: string | undefined;
  type: string;
  apiKey: string | undefined;
}

type CreateExternalSystemInput = Omit<ExternalSystem, "id">;

interface Props {
  match: any;
  mutations: {
    createExternalSystem: (
      input: CreateExternalSystemInput
    ) => Promise<{ data: { createExternalSystem: ExternalSystem } }>;
    editExternalSystem: (
      id: string,
      input: CreateExternalSystemInput
    ) => Promise<{ data: { editExternalSystem: ExternalSystem } }>;
  };
  data: {
    externalSystems: ExternalSystem[];
  };
}

interface State {
  editingExternalSystem: "new" | string | undefined;
  externalSystem: CreateExternalSystemInput;
}

class AdminExternalSystems extends Component<Props, State> {
  state = {
    editingExternalSystem: undefined,
    externalSystem: {
      name: undefined,
      type: EXTERNAL_SYSTEM_OPTS[0][1],
      apiKey: undefined
    }
  };

  startCreateExternalSystem = () =>
    this.setState({ editingExternalSystem: "new" });

  makeStartEditExternalSystem = (systemId: string) => () =>
    this.setState({
      editingExternalSystem: systemId,
      externalSystem: this.props.data.externalSystems.find(
        s => s.id === systemId
      )!
    });

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

  editExternalSystemProp = (prop: string) => (_: unknown, newVal: string) =>
    this.setState(prevState => ({
      externalSystem: { ...prevState.externalSystem, ...{ [prop]: newVal } }
    }));

  render() {
    const { externalSystems } = this.props.data;
    const { editingExternalSystem, externalSystem } = this.state;
    const { name, type, apiKey } = externalSystem;

    return (
      <div>
        <RaisedButton
          label="New Integration"
          primary={true}
          icon={<CreateIcon />}
          onClick={this.startCreateExternalSystem}
        />

        <br />

        {(externalSystems || []).map(system => (
          <Paper key={system.id} style={styles.card}>
            <div style={{ display: "flex" }}>
              <Chip backgroundColor={"#DDEEEE"} style={styles.chip}>
                {system.name}
              </Chip>
            </div>

            <div style={{ display: "flex" }}>
              <RaisedButton
                label="Edit"
                labelPosition="before"
                primary={true}
                icon={<CreateIcon />}
                style={{ marginRight: 10 }}
                onClick={this.makeStartEditExternalSystem(system.id)}
              />
            </div>
          </Paper>
        ))}

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
            name="apiKey"
            floatingLabelText="API Key"
            fullWidth={true}
            value={apiKey}
            onChange={this.editExternalSystemProp("apiKey")}
          />
        </Dialog>
      </div>
    );
  }
}

const queries = {
  data: {
    query: gql`
      query getExternalSystems($organizationId: String!) {
        externalSystems(organizationId: $organizationId) {
          id
          name
          type
          apiKey
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
    externalSystem: CreateExternalSystemInput
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
          apiKey
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
    externalSystem: CreateExternalSystemInput
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
          apiKey
        }
      }
    `,
    variables: {
      id: id,
      externalSystem
    }
  })
};

export default withOperations({
  queries,
  mutations
})(AdminExternalSystems);
