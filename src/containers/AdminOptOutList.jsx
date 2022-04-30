import { gql } from "@apollo/client";
import NotInterestedIcon from "@material-ui/icons/NotInterested";
import { List, ListItem } from "material-ui/List";
import PropTypes from "prop-types";
import React from "react";

import Empty from "../components/Empty";
import { loadData } from "./hoc/with-operations";

const AdminOptOutList = function AdminOptOutList(props) {
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
            <ListItem key={optOut.id} primaryText={optOut.cell} />
          ))}
        </List>
      )}
    </div>
  );
};

AdminOptOutList.propTypes = {
  data: PropTypes.object
};

const queries = {
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
