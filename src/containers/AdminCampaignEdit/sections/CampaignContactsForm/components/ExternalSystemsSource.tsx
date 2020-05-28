import React from "react";
import gql from "graphql-tag";
import { compose } from "recompose";
import { ApolloQueryResult } from "apollo-client";

import Avatar from "material-ui/Avatar";
import { List, ListItem } from "material-ui/List";
import IconButton from "material-ui/IconButton";
import RefreshIcon from "material-ui/svg-icons/navigation/refresh";
import ActionGrade from "material-ui/svg-icons/action/grade";
import ContentDrafts from "material-ui/svg-icons/content/drafts";
import ContentSend from "material-ui/svg-icons/content/send";
import { green500, grey500 } from "material-ui/styles/colors";

import { loadData } from "../../../../hoc/with-operations";
import { ExternalSystem } from "../../../../../api/external-system";

interface Props {
  organizationId: string;
  onChangeExternalList(listId?: string): void;

  // HOC props
  externalLists: {
    organization: {
      id: string;
      externalSystems: ExternalSystem[];
    };
  };
  mutations: {
    refreshSystem(externalSystemId: string): ApolloQueryResult<{}>;
  };
}

interface State {}

export class ExternalSystemsSource extends React.Component<Props, State> {
  state = {};

  handleRefreshSystem = (systemId: string) => async () => {
    const { refreshSystem } = this.props.mutations;
    try {
      const response = await refreshSystem(systemId);
      if (response.errors) throw response.errors;
      // Stub
    } catch {
      // Stub
    } finally {
      // Stub
    }
  };

  render() {
    const {
      externalLists: {
        organization: { externalSystems }
      }
    } = this.props;

    if (externalSystems.length === 0) {
      return <p>No external systems.</p>;
    }

    return (
      <div>
        <h4>External Systems</h4>
        <List>
          {externalSystems.map(system => (
            <ListItem
              key={system.id}
              primaryText={system.name}
              // TODO: use real sync time
              secondaryText={`Last synced ${new Date().toLocaleString()}`}
              leftAvatar={
                <Avatar
                  backgroundColor={system.lists.length > 0 ? green500 : grey500}
                >
                  {system.lists.length > 9 ? "9+" : system.lists.length}
                </Avatar>
              }
              secondaryTextLines={2}
              rightIconButton={
                <IconButton onClick={this.handleRefreshSystem(system.id)}>
                  <RefreshIcon />
                </IconButton>
              }
              disabled={system.lists.length === 0}
              primaryTogglesNestedList={true}
              nestedItems={system.lists.map(list => (
                <ListItem
                  key={list.externalId}
                  primaryText={list.name}
                  secondaryText={`${list.description}\nContacts: ${
                    list.doorCount
                  }`}
                  secondaryTextLines={2}
                />
              ))}
            />
          ))}
        </List>
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
            lists {
              externalId
              name
              description
              listCount
              doorCount
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
