import gql from "graphql-tag";
import sortBy from "lodash/sortBy";
import Dialog from "material-ui/Dialog";
import FlatButton from "material-ui/FlatButton";
import FloatingActionButton from "material-ui/FloatingActionButton";
import RaisedButton from "material-ui/RaisedButton";
import { red500 } from "material-ui/styles/colors";
import DeleteForeverIcon from "material-ui/svg-icons/action/delete-forever";
import ContentAddIcon from "material-ui/svg-icons/content/add";
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn
} from "material-ui/Table";
import TextField from "material-ui/TextField";
import PropTypes from "prop-types";
import React from "react";

import theme from "../../../styles/theme";
import { loadData } from "../../hoc/with-operations";

const styles = {
  row: { cursor: "pointer" },
  tokenHighlight: { padding: "5px", backgroundColor: "#efefef" }
};

class TrollTokenSettings extends React.Component {
  state = {
    addToken: undefined,
    deleteToken: undefined,
    isWorking: false,
    error: undefined
  };

  handleOnCancelError = () => this.setState({ error: undefined });

  handleDeleteToken = (deleteToken) => () => this.setState({ deleteToken });

  handleOnCancelDelete = () => this.setState({ deleteToken: undefined });

  handleConfirmDeleteToken = async () => {
    const { deleteToken } = this.state;
    this.setState({ isWorking: true, error: undefined });
    try {
      const result = await this.props.mutations.deleteToken(deleteToken);
      console.log(result);
    } catch (err) {
      this.setState({ error: err.message });
    } finally {
      this.setState({ isWorking: false, deleteToken: undefined });
    }
  };

  handleAddToken = () => this.setState({ addToken: "" });

  handleOnCancelAddToken = () => this.setState({ addToken: undefined });

  handleOnChangeAddToken = (_, addToken) => this.setState({ addToken });

  handleOnConfirmAddToken = async () => {
    const { addToken } = this.state;
    this.setState({ isWorking: true, error: undefined });
    try {
      await this.props.mutations.addToken(addToken);
    } catch (err) {
      this.setState({ error: err.message });
    } finally {
      this.setState({ isWorking: false, addToken: undefined });
    }
  };

  render() {
    const { addToken, deleteToken, isWorking, error } = this.state;
    const { isActive } = this.props;
    const { trollTokens } = this.props.trollTokens;
    const sortedTokens = sortBy(trollTokens, "token");

    const addActions = [
      <FlatButton
        key="confirm"
        label="Confirm"
        onClick={this.handleOnConfirmAddToken}
      />,
      <FlatButton
        key="cancel"
        label="Cancel"
        primary
        onClick={this.handleOnCancelAddToken}
      />
    ];

    const deleteActions = [
      <FlatButton
        key="confirm"
        label="Confirm"
        onClick={this.handleConfirmDeleteToken}
      />,
      <FlatButton
        key="cancel"
        label="Cancel"
        primary
        onClick={this.handleOnCancelDelete}
      />
    ];

    const errorActions = [
      <FlatButton
        key="ok"
        label="Ok"
        primary
        onClick={this.handleOnCancelError}
      />
    ];

    return (
      <div>
        {trollTokens.length === 0 ? (
          <p>No trigger tokens defined yet.</p>
        ) : (
          <Table selectable={false} multiSelectable={false}>
            <TableHeader
              enableSelectAll={false}
              displaySelectAll={false}
              adjustForCheckbox={false}
            >
              <TableRow>
                <TableHeaderColumn>Token</TableHeaderColumn>
                <TableHeaderColumn>Actions</TableHeaderColumn>
              </TableRow>
            </TableHeader>
            <TableBody displayRowCheckbox={false} showRowHover>
              {sortedTokens.map(({ token }) => (
                <TableRow key={token} selectable style={styles.row}>
                  <TableRowColumn>{token}</TableRowColumn>
                  <TableRowColumn>
                    <RaisedButton
                      label="Delete"
                      labelPosition="before"
                      icon={<DeleteForeverIcon color={red500} />}
                      onClick={this.handleDeleteToken(token)}
                    />
                  </TableRowColumn>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {isActive && (
          <FloatingActionButton
            style={theme.components.floatingButton}
            disabled={isWorking}
            onClick={this.handleAddToken}
          >
            <ContentAddIcon />
          </FloatingActionButton>
        )}
        <Dialog
          title="Add Trigger Token"
          actions={addActions}
          open={addToken !== undefined}
          onRequestClose={this.handleOnCancelAddToken}
        >
          <TextField
            floatingLabelText="New token"
            value={addToken || ""}
            onChange={this.handleOnChangeAddToken}
          />
        </Dialog>
        <Dialog
          title="Confirm Delete"
          actions={deleteActions}
          open={deleteToken !== undefined}
          onRequestClose={this.handleOnCancelDelete}
        >
          Are you sure you want to delete the token{" "}
          <span style={styles.tokenHighlight}>{deleteToken || ""}</span>
        </Dialog>
        <Dialog
          title="Error"
          actions={errorActions}
          open={error !== undefined}
          onRequestClose={this.handleOnCancelError}
        >
          {error || ""}
        </Dialog>
      </div>
    );
  }
}

TrollTokenSettings.propTypes = {
  isActive: PropTypes.bool.isRequired,
  trollTokens: PropTypes.shape({
    trollTokens: PropTypes.arrayOf(
      PropTypes.shape({
        token: PropTypes.string.isRequired
      })
    ).isRequired
  }).isRequired
};

const queries = {
  trollTokens: {
    query: gql`
      query getTrollTokensForOrg($organizationId: String!) {
        trollTokens(organizationId: $organizationId) {
          token
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

const mutations = {
  addToken: (ownProps) => (token) => ({
    mutation: gql`
      mutation addTrollBotToken($organizationId: String!, $token: String!) {
        addToken(token: $token, organizationId: $organizationId)
      }
    `,
    variables: {
      organizationId: ownProps.match.params.organizationId,
      token
    },
    refetchQueries: ["getTrollTokensForOrg"]
  }),
  deleteToken: (ownProps) => (token) => ({
    mutation: gql`
      mutation deleteTrollBotToken($organizationId: String!, $token: String!) {
        removeToken(token: $token, organizationId: $organizationId)
      }
    `,
    variables: {
      organizationId: ownProps.match.params.organizationId,
      token
    },
    refetchQueries: ["getTrollTokensForOrg"]
  })
};

export default loadData({
  queries,
  mutations
})(TrollTokenSettings);
