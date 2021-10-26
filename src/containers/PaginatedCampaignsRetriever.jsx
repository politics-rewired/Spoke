import { gql } from "@apollo/client";
import isEqual from "lodash/isEqual";
import PropTypes from "prop-types";
import React, { Component } from "react";

import apolloClient from "../network/apollo-client-singleton";

const fetchCampaigns = async (offset, limit, organizationId, campaignsFilter) =>
  apolloClient.query({
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
              id
              dueBy
              title
            }
          }
        }
        organization(id: $organizationId) {
          id
          tagList {
            id
            title
          }
        }
      }
    `,
    variables: {
      cursor: { offset, limit },
      organizationId,
      campaignsFilter
    },
    fetchPolicy: "network-only"
  });

export class PaginatedCampaignsRetriever extends Component {
  componentDidMount() {
    this.handlePropsReceived();
  }

  componentDidUpdate(prevProps) {
    this.handlePropsReceived(prevProps);
  }

  handlePropsReceived = async (prevProps = {}) => {
    if (isEqual(prevProps, this.props)) return;

    const { organizationId, campaignsFilter, pageSize } = this.props;

    let offset = 0;
    let total;
    let campaigns = [];
    let tagList = [];
    do {
      const results = await fetchCampaigns(
        offset,
        pageSize,
        organizationId,
        campaignsFilter
      );
      tagList = results.data.organization.tagList;
      const { pageInfo, campaigns: newCampaigns } = results.data.campaigns;
      campaigns = campaigns.concat(newCampaigns);
      offset += pageSize;
      total = pageInfo.total;
    } while (offset < total);

    this.props.onTagsReceived(tagList);
    this.props.onCampaignsReceived(campaigns);
  };

  render() {
    return <div />;
  }
}

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

export default PaginatedCampaignsRetriever;
