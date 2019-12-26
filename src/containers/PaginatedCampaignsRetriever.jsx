import React, { Component } from "react";
import PropTypes from "prop-types";
import gql from "graphql-tag";

import { withOperations } from "./hoc/with-operations";

export class PaginatedCampaignsRetriever extends Component {
  constructor(props) {
    super(props);

    this.state = { offset: 0 };
  }

  componentDidMount() {
    this.handleCampaignsReceived();
  }

  componentDidUpdate(prevProps) {
    this.handleCampaignsReceived();
  }

  handleCampaignsReceived() {
    if (!this.props.campaignsAndTags || this.props.campaignsAndTags.loading) {
      return;
    }

    if (
      this.props.campaignsAndTags.campaigns.campaigns.length ===
      this.props.campaignsAndTags.campaigns.pageInfo.total
    ) {
      this.props.onCampaignsReceived(
        this.props.campaignsAndTags.campaigns.campaigns
      );
      this.props.onTagsReceived(
        this.props.campaignsAndTags.organization.tagList
      );
    }

    const newOffset =
      this.props.campaignsAndTags.campaigns.pageInfo.offset +
      this.props.pageSize;

    if (newOffset < this.props.campaignsAndTags.campaigns.pageInfo.total) {
      this.props.campaignsAndTags.fetchMore({
        variables: {
          cursor: {
            offset: newOffset,
            limit: this.props.pageSize
          }
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) {
            return prev;
          }
          const returnValue = Object.assign({}, prev);
          returnValue.campaigns.campaigns = returnValue.campaigns.campaigns.concat(
            fetchMoreResult.data.campaigns.campaigns
          );
          returnValue.campaigns.pageInfo =
            fetchMoreResult.data.campaigns.pageInfo;
          return returnValue;
        }
      });
    }
  }

  render() {
    return null;
  }
}

const queries = {
  campaignsAndTags: {
    query: gql`
      query qq(
        $organizationId: String!
        $cursor: OffsetLimitCursor
        $campaignsFilter: CampaignsFilter
      ) {
        campaigns(
          organizationId: $organizationId
          cursor: $cursor
          campaignsFilter: $campaignsFilter
        ) {
          ... on PaginatedCampaigns {
            pageInfo {
              offset
              limit
              total
            }
            campaigns {
              dueBy
              title
              id
            }
          }
        }
        organization(id: $organizationId) {
          tagList {
            id
            title
          }
        }
      }
    `,
    options: ownProps => ({
      variables: {
        cursor: { offset: 0, limit: ownProps.pageSize },
        organizationId: ownProps.organizationId,
        campaignsFilter: ownProps.campaignsFilter
      },
      forceFetch: true
    })
  }
};

PaginatedCampaignsRetriever.propTypes = {
  organizationId: PropTypes.string.isRequired,
  campaignsFilter: PropTypes.shape({
    isArchived: PropTypes.bool,
    campaignId: PropTypes.number
  }),
  onCampaignsReceived: PropTypes.func.isRequired,
  onTagsReceived: PropTypes.func.isRequired,
  pageSize: PropTypes.number.isRequired
};

export default withOperations({
  queries
})(PaginatedCampaignsRetriever);
