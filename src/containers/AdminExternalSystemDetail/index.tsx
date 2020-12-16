import gql from "graphql-tag";
import { History } from "history";
import { Card, CardHeader, CardText } from "material-ui/Card";
import IconButton from "material-ui/IconButton";
import ArrowBack from "material-ui/svg-icons/navigation/arrow-back";
import React from "react";
import { compose } from "react-apollo";
import { withRouter } from "react-router-dom";

import { ExternalSystem } from "../../api/external-system";
import { QueryMap } from "../../network/types";
import { loadData } from "../hoc/with-operations";

interface Props {
  match: any;
  history: History;
  data: {
    externalSystem: ExternalSystem;
  };
}

export const AdminExternalSystemsDetail: React.SFC<Props> = (props) => {
  const {
    match: {
      params: { organizationId }
    },
    history,
    data: { externalSystem }
  } = props;

  const handleNavigateToIntegrations = () =>
    history.push(`/admin/${organizationId}/integrations`);

  return (
    <div>
      <h1>
        <IconButton onClick={handleNavigateToIntegrations}>
          <ArrowBack />
        </IconButton>
        {externalSystem.name}
      </h1>
      <Card>
        <CardHeader title="Integration Information" />
        <CardText>
          <dl>
            <dt>Integration type</dt>
            <dd>{externalSystem.type}</dd>
            <dt>Username</dt>
            <dd>{externalSystem.username}</dd>
          </dl>
        </CardText>
      </Card>
    </div>
  );
};

const queries: QueryMap<Props> = {
  data: {
    query: gql`
      query getExternalSystem($systemId: String!) {
        externalSystem(systemId: $systemId) {
          id
          name
          type
          username
          apiKey
          syncedAt
        }
      }
    `,
    options: (ownProps) => ({
      variables: {
        systemId: ownProps.match.params.systemId
      }
    })
  }
};

export default compose(
  withRouter,
  loadData({ queries })
)(AdminExternalSystemsDetail);
