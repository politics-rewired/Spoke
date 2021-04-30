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
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TextField from "@material-ui/core/TextField";
import { ApolloQueryResult } from "apollo-client";
import gql from "graphql-tag";
import sortBy from "lodash/sortBy";
import FlatButton from "material-ui/FlatButton";
import FloatingActionButton from "material-ui/FloatingActionButton";
import RaisedButton from "material-ui/RaisedButton";
import { red500 } from "material-ui/styles/colors";
import DeleteForeverIcon from "material-ui/svg-icons/action/delete-forever";
import ContentAddIcon from "material-ui/svg-icons/content/add";
import React, { useState } from "react";
import { RouteChildrenProps } from "react-router-dom";

import { TrollTrigger, TrollTriggerMode } from "../../../api/trollbot";
import { MutationMap, QueryMap } from "../../../network/types";
import theme from "../../../styles/theme";
import { loadData } from "../../hoc/with-operations";

const styles = {
  row: { cursor: "pointer" },
  tokenHighlight: { padding: "5px", backgroundColor: "#efefef" }
};

type AddToken = Pick<TrollTrigger, "token" | "mode">;

interface HocProps {
  trollTokens: {
    trollTokens: Pick<
      TrollTrigger,
      "id" | "token" | "mode" | "compiledTsQuery"
    >[];
  };
  mutations: {
    addToken: (token: AddToken) => Promise<ApolloQueryResult<TrollTrigger>>;
    deleteToken: (token: string) => Promise<ApolloQueryResult<any>>;
  };
}

interface Props
  extends HocProps,
    Pick<RouteChildrenProps<{ organizationId: string }>, "match"> {
  isActive: boolean;
}

const labelForMode = (mode: TrollTriggerMode) => {
  switch (mode) {
    case TrollTriggerMode.English:
      return "Match similar uses (English)";
    case TrollTriggerMode.Spanish:
      return "Match similar uses (Spanish)";
    case TrollTriggerMode.Simple:
      return "Match exactly";
    default:
      return mode;
  }
};

const TrollTokenSettings: React.FC<Props> = (props) => {
  const [addToken, setAddToken] = useState<AddToken>();
  const [deleteToken, setDeleteToken] = useState<string>();
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string>();

  const handleOnCancelError = () => setError(undefined);

  const handleDeleteToken = (token: string) => () => setDeleteToken(token);

  const handleOnCancelDelete = () => setDeleteToken(undefined);

  const handleConfirmDeleteToken = async () => {
    if (!deleteToken) return;

    setIsWorking(true);
    setError(undefined);
    try {
      const response = await props.mutations.deleteToken(deleteToken);
      if (response.errors) throw response.errors[0];
    } catch (err) {
      setError(err.message);
    } finally {
      setIsWorking(false);
      setDeleteToken(undefined);
    }
  };

  const handleAddToken = () =>
    setAddToken({ token: "", mode: TrollTriggerMode.English });

  const handleOnCancelAddToken = () => setAddToken(undefined);

  const handleOnChangeAddToken: React.ChangeEventHandler<
    HTMLInputElement | HTMLTextAreaElement
  > = (event) => {
    const token = event.target.value as string;
    setAddToken((prev) => ({
      mode: prev?.mode ?? TrollTriggerMode.English,
      token
    }));
  };

  const handleOnChangeAddTokenMode = (
    event: React.ChangeEvent<{ value: unknown }>
  ) => {
    const mode = event.target.value as TrollTriggerMode;
    setAddToken((prev) => ({
      token: prev?.token ?? "",
      mode
    }));
  };

  const handleOnConfirmAddToken = async () => {
    if (!addToken) return;

    setIsWorking(true);
    setError(undefined);
    try {
      await props.mutations.addToken(addToken);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsWorking(false);
      setAddToken(undefined);
    }
  };

  const { isActive } = props;
  const { trollTokens } = props.trollTokens;
  const sortedTokens = sortBy(trollTokens, "token");

  const addActions = [
    <FlatButton
      key="confirm"
      label="Confirm"
      onClick={handleOnConfirmAddToken}
    />,
    <FlatButton
      key="cancel"
      label="Cancel"
      primary
      onClick={handleOnCancelAddToken}
    />
  ];

  const deleteActions = [
    <FlatButton
      key="confirm"
      label="Confirm"
      onClick={handleConfirmDeleteToken}
    />,
    <FlatButton
      key="cancel"
      label="Cancel"
      primary
      onClick={handleOnCancelDelete}
    />
  ];

  const errorActions = [
    <FlatButton key="ok" label="Ok" primary onClick={handleOnCancelError} />
  ];

  return (
    <>
      {trollTokens.length === 0 ? (
        <p>No trigger tokens defined yet.</p>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Token</TableCell>
                <TableCell align="right">Mode</TableCell>
                <TableCell align="right">Parsed Token</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedTokens.map(({ token, mode, compiledTsQuery }) => (
                <TableRow key={token} style={styles.row}>
                  <TableCell scope="row">{token}</TableCell>
                  <TableCell align="right">{labelForMode(mode)}</TableCell>
                  <TableCell align="right">
                    <span style={styles.tokenHighlight}>{compiledTsQuery}</span>
                  </TableCell>
                  <TableCell align="right">
                    <RaisedButton
                      label="Delete"
                      labelPosition="before"
                      icon={<DeleteForeverIcon color={red500} />}
                      onClick={handleDeleteToken(token)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {isActive && (
        <FloatingActionButton
          style={theme.components.floatingButton}
          disabled={isWorking}
          onClick={handleAddToken}
        >
          <ContentAddIcon />
        </FloatingActionButton>
      )}
      <Dialog open={addToken !== undefined} onClose={handleOnCancelAddToken}>
        <DialogTitle>Add Trigger Token</DialogTitle>
        <DialogContent>
          <FormControl fullWidth>
            <TextField
              label="New token"
              fullWidth
              value={addToken?.token ?? ""}
              onChange={handleOnChangeAddToken}
            />
          </FormControl>
          <br />
          <FormControl>
            <InputLabel>Mode</InputLabel>
            <Select
              value={addToken?.mode}
              fullWidth
              onChange={handleOnChangeAddTokenMode}
            >
              {[
                TrollTriggerMode.English,
                TrollTriggerMode.Spanish,
                TrollTriggerMode.Simple
              ].map((mode) => (
                <MenuItem key={mode} value={mode}>
                  {labelForMode(mode)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>{addActions}</DialogActions>
      </Dialog>
      <Dialog open={deleteToken !== undefined} onClose={handleOnCancelDelete}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the token{" "}
            <span style={styles.tokenHighlight}>{deleteToken || ""}</span>
          </DialogContentText>
        </DialogContent>
        <DialogActions>{deleteActions}</DialogActions>
      </Dialog>
      <Dialog open={error !== undefined} onClose={handleOnCancelError}>
        <DialogTitle>Error</DialogTitle>
        <DialogContent>
          <DialogContentText>{error || ""}</DialogContentText>
        </DialogContent>
        <DialogActions>{errorActions}</DialogActions>
      </Dialog>
    </>
  );
};

const queries: QueryMap<Props> = {
  trollTokens: {
    query: gql`
      query getTrollTokensForOrg($organizationId: String!) {
        trollTokens(organizationId: $organizationId) {
          token
          mode
          compiledTsQuery
        }
      }
    `,
    options: (ownProps) => ({
      variables: {
        organizationId: ownProps.match?.params.organizationId
      }
    })
  }
};

const mutations: MutationMap<Props> = {
  addToken: (ownProps) => (input: AddToken) => ({
    mutation: gql`
      mutation addTrollBotToken(
        $organizationId: String!
        $input: TrollTriggerInput!
      ) {
        addToken(organizationId: $organizationId, input: $input)
      }
    `,
    variables: {
      organizationId: ownProps.match?.params.organizationId,
      input
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
      organizationId: ownProps.match?.params.organizationId,
      token
    },
    refetchQueries: ["getTrollTokensForOrg"]
  })
};

export default loadData({
  queries,
  mutations
})(TrollTokenSettings);
