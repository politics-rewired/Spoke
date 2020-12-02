import gql from "graphql-tag";
import PropTypes from "prop-types";
import React from "react";
import { compose } from "react-apollo";
import { withRouter } from "react-router-dom";

import { loadData } from "./hoc/with-operations";

class DashboardLoader extends React.Component {
  componentWillMount() {
    if (this.props.data.currentUser.organizations.length > 0) {
      this.props.history.push(
        `${this.props.path}/${this.props.data.currentUser.organizations[0].id}`
      );
    } else {
      this.props.history.push("/");
    }
  }

  render() {
    return <div />;
  }
}

DashboardLoader.propTypes = {
  data: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  path: PropTypes.string
};

const queries = {
  data: {
    query: gql`
      query getCurrentUserForLoader {
        currentUser {
          id
          organizations {
            id
          }
        }
      }
    `,
    options: {
      fetchPolicy: "network-only"
    }
  }
};

export default compose(withRouter, loadData({ queries }))(DashboardLoader);
