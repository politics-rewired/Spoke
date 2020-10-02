import React from "react";
import PropTypes from "prop-types";
import gql from "graphql-tag";

import { withOperations } from "../hoc/with-operations";
import LoadingIndicator from "../../components/LoadingIndicator";
import CampaignList from "./CampaignList";

export class CampaignListLoader extends React.Component {
  componentDidUpdate(prevProps) {
    const { organization: prevOrganization } = prevProps.data;
    const oldTotal =
      (prevOrganization && prevOrganization.campaigns.pageInfo.total) || -1;
    const { organization } = this.props.data;
    const total = (organization && organization.campaigns.pageInfo.total) || -1;

    if (total !== oldTotal) {
      const resultCount = total >= 0 ? total : undefined;
      this.props.resultCountDidUpdate(resultCount);
    }
  }

  render() {
    const {
      organizationId,
      data,
      adminPerms,
      startOperation,
      archiveCampaign,
      unarchiveCampaign
    } = this.props;

    if (data.loading) {
      return <LoadingIndicator />;
    }

    const { campaigns } = data.organization.campaigns;

    return (
      <CampaignList
        organizationId={organizationId}
        campaigns={campaigns}
        adminPerms={adminPerms}
        startOperation={startOperation}
        archiveCampaign={archiveCampaign}
        unarchiveCampaign={unarchiveCampaign}
      />
    );
  }
}

CampaignListLoader.defaultProps = {
  offset: 0
};

CampaignListLoader.propTypes = {
  organizationId: PropTypes.string.isRequired,
  campaignsFilter: PropTypes.object,
  offset: PropTypes.number,
  limit: PropTypes.number.isRequired,
  adminPerms: PropTypes.bool.isRequired,
  resultCountDidUpdate: PropTypes.func.isRequired,
  startOperation: PropTypes.func.isRequired,
  archiveCampaign: PropTypes.func.isRequired,
  unarchiveCampaign: PropTypes.func.isRequired
};

const queries = {
  data: {
    query: gql`
      query adminGetCampaigns(
        $organizationId: String!
        $campaignsFilter: CampaignsFilter
        $offset: Int!
        $limit: Int!
      ) {
        organization(id: $organizationId) {
          id
          campaigns(
            campaignsFilter: $campaignsFilter
            cursor: { offset: $offset, limit: $limit }
          ) {
            campaigns {
              id
              title
              isStarted
              isArchived
              isAutoassignEnabled
              hasUnassignedContacts
              hasUnsentInitialMessages
              hasUnhandledMessages
              description
              dueBy
              creator {
                displayName
              }
              teams {
                id
                title
              }
              externalSystem {
                id
                type
                name
              }
            }
            pageInfo {
              total
            }
          }
        }
      }
    `,
    options: ownProps => ({
      variables: {
        organizationId: ownProps.organizationId,
        campaignsFilter: ownProps.campaignsFilter,
        offset: ownProps.offset,
        limit: ownProps.limit
      },
      fetchPolicy: "network-only"
    })
  }
};

export default withOperations({
  queries
})(CampaignListLoader);
