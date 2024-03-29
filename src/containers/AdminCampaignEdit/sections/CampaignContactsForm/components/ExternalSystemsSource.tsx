import { gql } from "@apollo/client";
import { makeStyles } from "@material-ui/core";
import Avatar from "@material-ui/core/Avatar";
import { green, grey } from "@material-ui/core/colors";
import { Card, CardHeader, CardText } from "material-ui/Card";
import DropDownMenu from "material-ui/DropDownMenu";
import MenuItem from "material-ui/MenuItem";
import React from "react";

import type { ExternalSystem } from "../../../../../api/external-system";
import { DateTime } from "../../../../../lib/datetime";
import { loadData } from "../../../../hoc/with-operations";

const useStyles = makeStyles({
  hasLists: {
    backgroundColor: green[500]
  },
  noLists: {
    backgroundColor: grey[500]
  }
});

interface Props {
  systemId: string;
  selectedListId?: string;
  onChangeExternalList(listId?: string): void;

  // HOC props
  externalLists: {
    externalSystem: ExternalSystem;
  };
}

export const ExternalSystemsSource: React.FC<Props> = (props) => {
  const styles = useStyles();

  const handleSelectList = (
    _event: React.SyntheticEvent<unknown>,
    _index: number,
    listId: string
  ) => {
    const { selectedListId } = props;
    props.onChangeExternalList(selectedListId === listId ? undefined : listId);
  };

  const {
    selectedListId,
    externalLists: { externalSystem }
  } = props;

  const listCount = externalSystem.lists.edges.length;

  return (
    <Card expandable={false} expanded={false}>
      <CardHeader
        title={externalSystem.name}
        subtitle={`Lists last pulled: ${
          externalSystem.syncedAt
            ? DateTime.fromISO(externalSystem.syncedAt).toRelative()
            : "never"
        }`}
        avatar={
          <Avatar className={listCount > 0 ? styles.hasLists : styles.noLists}>
            {listCount > 9 ? "9+" : listCount}
          </Avatar>
        }
        showExpandableButton={false}
      />

      {externalSystem.lists.pageInfo.totalCount > 0 && (
        <CardText>
          Choose a list:
          <br />
          <DropDownMenu
            value={selectedListId}
            onChange={handleSelectList}
            style={{ width: "50%" }}
          >
            {externalSystem.lists.edges.map(({ node: list }) => (
              <MenuItem
                key={list.externalId}
                value={list.externalId}
                primaryText={`${list.name} (${list.listCount} contacts)`}
              />
            ))}
          </DropDownMenu>
        </CardText>
      )}
    </Card>
  );
};

const queries = {
  externalLists: {
    query: gql`
      query getExternalLists($systemId: String!) {
        externalSystem(systemId: $systemId) {
          id
          name
          type
          apiKey
          createdAt
          updatedAt
          syncedAt
          lists {
            pageInfo {
              totalCount
            }
            edges {
              node {
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
      }
    `,
    options: (ownProps: Props) => ({
      variables: {
        systemId: ownProps.systemId
      }
    })
  }
};

export default loadData({
  queries
})(ExternalSystemsSource);
