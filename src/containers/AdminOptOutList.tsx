import { gql } from "@apollo/client";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import NotInterestedIcon from "@material-ui/icons/NotInterested";
import { OptOut } from "@spoke/spoke-codegen";
import React from "react";
import { match } from "react-router-dom";

import Empty from "../components/Empty";
import { QueryMap } from "../network/types";
import { loadData } from "./hoc/with-operations";

interface AdminOptOutListProps {
  data: {
    organization: {
      optOuts: OptOut[];
    };
  };
  match: match<{ organizationId: string }>;
}

const AdminOptOutList: React.FC<AdminOptOutListProps> = (props) => {
  const { data } = props;
  const { optOuts } = data.organization;
  return (
    <div>
      {optOuts.length === 0 ? (
        <Empty
          title="Yay, no one has opted out!"
          icon={<NotInterestedIcon />}
        />
      ) : (
        <List>
          {optOuts.map((optOut) => (
            <ListItem key={optOut.id}>
              <ListItemText primary={optOut.cell} />
            </ListItem>
          ))}
        </List>
      )}
    </div>
  );
};

const queries: QueryMap<AdminOptOutListProps> = {
  data: {
    query: gql`
      query getOptOuts($organizationId: String!) {
        organization(id: $organizationId) {
          id
          optOuts {
            id
            cell
          }
        }
      }
    `,
    options: (ownProps) => ({
      variables: {
        organizationId: ownProps.match.params.organizationId
      },
      fetchPolicy: "network-only"
    })
  }
};

export default loadData({ queries })(AdminOptOutList);
