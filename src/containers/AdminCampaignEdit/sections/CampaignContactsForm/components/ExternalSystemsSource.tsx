import React from "react";
import gql from "graphql-tag";
import moment from "moment";
import { ApolloQueryResult } from "apollo-client";

import Avatar from "material-ui/Avatar";
import DropDownMenu from "material-ui/DropDownMenu";
import MenuItem from "material-ui/MenuItem";
import { Card, CardHeader, CardText } from "material-ui/Card";
import RaisedButton from "material-ui/RaisedButton";
import IconButton from "material-ui/IconButton";
import Snackbar from "material-ui/Snackbar";
import RefreshIcon from "material-ui/svg-icons/navigation/refresh";
import SyncIcon from "material-ui/svg-icons/notification/sync";
import { green500, grey200, grey500 } from "material-ui/styles/colors";

import { loadData } from "../../../../hoc/with-operations";
import { ExternalSystem } from "../../../../../api/external-system";

interface Props {
  organizationId: string;
  selectedListId?: string;
  onChangeExternalList(listId?: string): void;

  // HOC props
  externalLists: {
    organization: {
      id: string;
      externalSystems: ExternalSystem[];
    };
    refetch(): void;
  };
  mutations: {
    refreshSystem(externalSystemId: string): ApolloQueryResult<{}>;
  };
}

interface State {
  syncInitiatedForId?: string;
}

export class ExternalSystemsSource extends React.Component<Props, State> {
  state: State = {
    syncInitiatedForId: undefined
  };

  handleSyncSystem = (systemId: string) => async () => {
    const { refreshSystem } = this.props.mutations;
    try {
      const response = await refreshSystem(systemId);
      if (response.errors) throw response.errors;
      this.setState({ syncInitiatedForId: systemId });
    } catch {
      // Stub
    } finally {
      // Stub
    }
  };

  handleDismissSyncSnackbar = (systemId: string) => async () =>
    this.setState({ syncInitiatedForId: undefined });

  handleSelectList = (
    _event: React.SyntheticEvent<{}>,
    _index: number,
    listId: string
  ) => {
    const { selectedListId } = this.props;
    this.props.onChangeExternalList(
      selectedListId === listId ? undefined : listId
    );
  };

  handleRefreshSystems = () => this.props.externalLists.refetch();

  render() {
    const {
      selectedListId,
      externalLists: {
        organization: { externalSystems }
      }
    } = this.props;

    if (externalSystems.length === 0) {
      return <p>No external systems.</p>;
    }

    const system = this.props.externalLists.organization.externalSystems.find(
      ({ id }) => id === this.state.syncInitiatedForId
    );

    return (
      <div>
        <h4>Integrations</h4>
        <RaisedButton
          label="Refresh"
          labelPosition="before"
          icon={<RefreshIcon />}
          onClick={this.handleRefreshSystems}
        />
        {externalSystems.map(system => (
          <Card
            key={system.id}
            style={{ marginTop: "10px" }}
            expanded={false}
            onExpandChange={() => {}}
          >
            <CardHeader
              title={system.name}
              subtitle={`Lists last pulled: ${
                system.syncedAt ? moment(system.syncedAt).fromNow() : "never"
              }`}
              avatar={
                <Avatar
                  backgroundColor={system.lists.length > 0 ? green500 : grey500}
                >
                  {system.lists.length > 9 ? "9+" : system.lists.length}
                </Avatar>
              }
              showExpandableButton={true}
              closeIcon={
                <IconButton
                  onClick={this.handleSyncSystem(system.id)}
                  disabled={this.state.syncInitiatedForId === system.id}
                >
                  <SyncIcon />
                </IconButton>
              }
            />

            {system.lists.length > 0 && (
              <CardText>
                Choose a list:<br />
                <DropDownMenu
                  value={selectedListId}
                  onChange={this.handleSelectList}
                  style={{ width: "50%" }}
                >
                  {system.lists.map(list => (
                    <MenuItem
                      value={list.externalId}
                      primaryText={`${list.name} (${list.listCount} contacts)`}
                    />
                  ))}
                </DropDownMenu>
              </CardText>
            )}
          </Card>
        ))}
        <Snackbar
          open={system !== undefined}
          message={
            system
              ? `Sync started for ${
                  system.name
                }. Please refresh systems to see updated lists.`
              : undefined
          }
          autoHideDuration={4000}
          onRequestClose={
            system ? this.handleDismissSyncSnackbar(system.id) : undefined
          }
        />
      </div>
    );
  }
}

const queries = {
  externalLists: {
    // TODO: paginate these results relay-style
    query: gql`
      query getExternalLists($organizationId: String!) {
        organization(id: $organizationId) {
          id
          externalSystems {
            id
            name
            type
            apiKey
            createdAt
            updatedAt
            syncedAt
            lists {
              externalId
              name
              description
              listCount
              doorCount
              createdAt
              updatedAt
            }
          }
        }
      }
    `,
    options: (ownProps: Props) => ({
      variables: {
        organizationId: ownProps.organizationId
      }
    })
  }
};

const mutations = {
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
})(ExternalSystemsSource);
