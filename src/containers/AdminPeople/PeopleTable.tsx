// import { useQuery } from "@apollo/react-hooks";
import gql from "graphql-tag";
import PeopleIcon from "material-ui/svg-icons/social/people";
import { Table, TableBody } from "material-ui/Table";
import React from "react";

import {
  MembershipFilter,
  OrganizationMembership
} from "../../api/organization-membership";
import Empty from "../../components/Empty";
import InfiniteRelayList from "../../components/InfiniteRelayList";
import { AdminPeopleContext, PersonMutationHandler } from "./context";
import PeopleRow from "./PeopleRow";

const query = gql`
  query getPeople(
    $organizationId: String!
    $after: Cursor
    $first: Int
    $filter: MembershipFilter
  ) {
    organization(id: $organizationId) {
      id
      peopleCount
      memberships(first: $first, after: $after, filter: $filter) {
        edges {
          node {
            id
            user {
              id
              firstName
              lastName
              displayName
              email
            }
            role
            requestAutoApprove
          }
        }
        pageInfo {
          endCursor
          hasNextPage
          totalCount
        }
      }
    }
  }
`;

const PAGE_SIZE = 20;
interface PeopleTableProps {
  context: AdminPeopleContext;
  onlyCampaignId: number | false;
  nameSearch: string;
  on: PersonMutationHandler;
  freshness: Date;
}
const PeopleTable: React.StatelessComponent<PeopleTableProps> = ({
  context,
  nameSearch,
  onlyCampaignId,
  on,
  freshness
}) => {
  const filter: MembershipFilter = {
    nameSearch: nameSearch === "" ? undefined : nameSearch,
    ...(onlyCampaignId ? { campaignId: onlyCampaignId } : {})
  };

  return (
    <Table selectable={false}>
      <TableBody displayRowCheckbox={false} showRowHover>
        <InfiniteRelayList
          query={query}
          dbLastUpdatedAt={freshness}
          queryVars={{
            organizationId: context.organization.id,
            first: PAGE_SIZE,
            filter
          }}
          nextQueryVars={(cursor) => ({
            after: cursor,
            filter
          })}
          toRelay={(data) => data.organization.memberships}
          renderNode={(membership: OrganizationMembership) => (
            <PeopleRow membership={membership} context={context} on={on} />
          )}
          empty={() => <Empty title="No people yet" icon={<PeopleIcon />} />}
        />
      </TableBody>
    </Table>
  );
};
export default PeopleTable;
