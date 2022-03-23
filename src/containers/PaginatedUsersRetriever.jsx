import { gql } from "@apollo/client";
import isEqual from "lodash/isEqual";
import PropTypes from "prop-types";
import React, { Component } from "react";

import { UserRoleType } from "../api/organization-membership";
import apolloClient from "../network/apollo-client-singleton";

const fetchPeople = async ({
  organizationId,
  after,
  first,
  campaignsFilter,
  filterSuspended
}) => {
  const filter = {};
  if (campaignsFilter.isArchived !== undefined) {
    filter.campaignArchived = campaignsFilter.isArchived;
  }
  if (campaignsFilter.campaignId !== undefined) {
    filter.campaignId = campaignsFilter.campaignId;
  }
  if (filterSuspended) {
    filter.roles = [
      UserRoleType.ADMIN,
      UserRoleType.OWNER,
      UserRoleType.SUPERADMIN,
      UserRoleType.SUPERVOLUNTEER,
      UserRoleType.TEXTER
    ];
  }

  return apolloClient.query({
    query: gql`
      query getUsers(
        $organizationId: String!
        $after: Cursor
        $first: Int!
        $filter: MembershipFilter
      ) {
        organization(id: $organizationId) {
          id
          memberships(after: $after, first: $first, filter: $filter) {
            edges {
              node {
                id
                user {
                  id
                  displayName
                  email
                }
                role
              }
            }
            pageInfo {
              totalCount
              hasNextPage
              endCursor
            }
          }
        }
      }
    `,
    variables: {
      organizationId,
      after,
      first,
      filter
    },
    fetchPolicy: "network-only"
  });
};

export class PaginatedUsersRetriever extends Component {
  latestRequestRef = undefined;

  componentDidMount() {
    this.handlePropsReceived();
  }

  componentDidUpdate(prevProps) {
    this.handlePropsReceived(prevProps);
  }

  handlePropsReceived = async (prevProps = {}) => {
    if (isEqual(prevProps, this.props)) return;

    const {
      organizationId,
      campaignsFilter = {},
      pageSize,
      filterSuspended
    } = this.props;

    // Track current request so we can bail on fetching if a new request has been kicked off
    const requestRef = new Date().getTime();
    this.latestRequestRef = requestRef;

    this.props.onUsersReceived([]);
    this.props.setCampaignTextersLoadedFraction(0);

    let after = null;
    let totalCount;
    let users = [];
    do {
      const results = await fetchPeople({
        organizationId,
        after,
        first: pageSize,
        campaignsFilter,
        filterSuspended
      });
      const { pageInfo, edges } = results.data.organization.memberships;
      const newUsers = edges.map((edge) => ({
        ...edge.node.user,
        role: edge.node.role
      }));
      users = users.concat(newUsers);
      after = pageInfo.hasNextPage ? pageInfo.endCursor : null;
      totalCount = pageInfo.totalCount;

      // Ignore if not the most recent request
      if (requestRef === this.latestRequestRef) {
        const fraction = Math.min(1, users.length / totalCount);
        this.props.setCampaignTextersLoadedFraction(fraction);
      }
    } while (after !== null && requestRef === this.latestRequestRef);

    // Ignore if not the most recent request
    if (requestRef === this.latestRequestRef) {
      this.props.onUsersReceived(users);
    }
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
  setCampaignTextersLoadedFraction: PropTypes.func,
  filterSuspended: PropTypes.bool
};

export default PaginatedUsersRetriever;
