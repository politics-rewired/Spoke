import React, { Component } from "react";
import PropTypes from "prop-types";
import gql from "graphql-tag";
import isEqual from "lodash/isEqual";

import apolloClient from "../network/apollo-client-singleton";

const fetchPeople = async (offset, limit, organizationId, campaignsFilter) =>
  apolloClient.query({
    query: gql`
      query getUsers(
        $organizationId: String!
        $cursor: OffsetLimitCursor
        $campaignsFilter: CampaignsFilter
      ) {
        people(
          organizationId: $organizationId
          cursor: $cursor
          campaignsFilter: $campaignsFilter
        ) {
          ... on PaginatedUsers {
            pageInfo {
              offset
              limit
              total
            }
            users {
              id
              displayName
              email
              roles(organizationId: $organizationId)
            }
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

export class PaginatedUsersRetriever extends Component {
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
    let total = undefined;
    let users = [];
    do {
      const results = await fetchPeople(
        offset,
        pageSize,
        organizationId,
        campaignsFilter
      );
      const { pageInfo, users: newUsers } = results.data.people;
      users = users.concat(newUsers);
      offset += pageSize;
      total = pageInfo.total;
      this.props.setCampaignTextersLoadedFraction(Math.min(1, offset / total));
    } while (offset < total);

    this.props.onUsersReceived(users);
  };

  render() {
    return <div />;
  }
}

PaginatedUsersRetriever.defaultProps = {
  setCampaignTextersLoadedFraction: () => {}
};

PaginatedUsersRetriever.propTypes = {
  organizationId: PropTypes.string.isRequired,
  pageSize: PropTypes.number.isRequired,
  onUsersReceived: PropTypes.func.isRequired,
  campaignsFilter: PropTypes.shape({
    isArchived: PropTypes.bool,
    campaignId: PropTypes.number
  }),
  setCampaignTextersLoadedFraction: PropTypes.func
};

export default PaginatedUsersRetriever;
