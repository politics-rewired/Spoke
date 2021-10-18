import { ApolloQueryResult } from "@apollo/client";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import gql from "graphql-tag";
import { Card, CardHeader, CardText } from "material-ui/Card";
import CircularProgress from "material-ui/CircularProgress";
import FlatButton from "material-ui/FlatButton";
import MenuItem from "material-ui/MenuItem";
import SelectField from "material-ui/SelectField";
import React from "react";

import { ExternalSystem } from "../../../api/external-system";
import { sleep } from "../../../lib/utils";
import { MutationMap, QueryMap } from "../../../network/types";
import { loadData } from "../../hoc/with-operations";

interface Props {
  systemId: string;
  mutations: {
    editSyncConfig(targetId: string | null): Promise<ApolloQueryResult<any>>;
  };
  syncConfig: {
    externalSystem: Pick<ExternalSystem, "id" | "optOutSyncConfig">;
  };
  resultCodes: { externalSystem: Pick<ExternalSystem, "id" | "resultCodes"> };
}

interface State {
  isWorking: boolean;
  error?: string;
}

class OptOutConfigurationCard extends React.Component<Props, State> {
  state: State = {
    isWorking: false,
    error: undefined
  };

  handleChangeResultCode = async (
    e: React.SyntheticEvent<unknown>,
    index: number,
    targetId: string | null
  ) => {
    this.setState({ isWorking: true });

    try {
      // Ensure loading indicator is shown at least long enough for the user to see
      await Promise.all([
        sleep(400),
        this.props.mutations.editSyncConfig(targetId).then((response) => {
          if (response.errors) throw response.errors;
        })
      ]);
    } catch (err) {
      this.setState({ error: err.message });
    } finally {
      this.setState({ isWorking: false });
    }
  };

  handleDismissError = () => this.setState({ error: undefined });

  render() {
    const { error, isWorking } = this.state;
    const {
      syncConfig: {
        externalSystem: { optOutSyncConfig }
      },
      resultCodes: {
        externalSystem: { resultCodes }
      }
    } = this.props;

    return (
      <Card>
        <CardHeader title="Opt Out Sync Configuration" />
        <CardText>
          Map Spoke Opt Outs to the result code selected below. If no result
          code is selected, opt outs will not be synced.
          <div style={{ display: "flex", alignItems: "center" }}>
            <SelectField
              floatingLabelText="Result Code"
              value={optOutSyncConfig?.resultCode.id}
              fullWidth
              disabled={isWorking}
              onChange={this.handleChangeResultCode}
            >
              <MenuItem value={null} primaryText="" />
              {resultCodes.edges.map(({ node }) => (
                <MenuItem
                  key={node.id}
                  value={node.id}
                  primaryText={node.name}
                />
              ))}
            </SelectField>
            <CircularProgress
              style={{
                visibility: isWorking ? "visible" : "hidden",
                marginLeft: "10px"
              }}
            />
          </div>
        </CardText>
        <Dialog open={error !== undefined} onClose={this.handleDismissError}>
          <DialogTitle>Error Saving Opt Out Sync Configuration</DialogTitle>
          <DialogContent>
            <DialogContentText>{error}</DialogContentText>
          </DialogContent>
          <DialogActions>
            <FlatButton
              key="close"
              label="Close"
              primary
              onClick={this.handleDismissError}
            />
          </DialogActions>
        </Dialog>
      </Card>
    );
  }
}

const queries: QueryMap<Props> = {
  syncConfig: {
    query: gql`
      query getOptOutSyncConfig($systemId: String!) {
        externalSystem(systemId: $systemId) {
          id
          optOutSyncConfig {
            id
            resultCode {
              id
              name
            }
          }
        }
      }
    `,
    options: ({ systemId }) => ({
      variables: { systemId }
    })
  },
  resultCodes: {
    query: gql`
      query getExternalResultCodes($systemId: String!) {
        externalSystem(systemId: $systemId) {
          id
          resultCodes {
            edges {
              node {
                id
                name
              }
            }
          }
        }
      }
    `,
    options: ({ systemId }) => ({
      variables: { systemId }
    })
  }
};

const mutations: MutationMap<Props> = {
  editSyncConfig: (ownProps) => (targetId: string | null) => ({
    mutation: gql`
      mutation editExternalOptOutSyncConfig(
        $systemId: String!
        $targetId: String
      ) {
        editExternalOptOutSyncConfig(systemId: $systemId, targetId: $targetId) {
          id
          optOutSyncConfig {
            id
            resultCode {
              id
              name
            }
          }
        }
      }
    `,
    variables: {
      systemId: ownProps.systemId,
      targetId
    },
    refetchQueries: ["getExternalSystems"]
  })
};

export default loadData({
  mutations,
  queries
})(OptOutConfigurationCard);
