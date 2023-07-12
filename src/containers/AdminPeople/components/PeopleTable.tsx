/* eslint-disable react/no-unstable-nested-components */
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import PeopleIcon from "@material-ui/icons/People";
import type {
  MembershipFilter,
  OrganizationMembership
} from "@spoke/spoke-codegen";
import { GetOrganizationPeopleDocument } from "@spoke/spoke-codegen";
import React from "react";

import type { RelayPaginatedResponse } from "../../../api/pagination";
import Empty from "../../../components/Empty";
import type { AdminPeopleContext, PeopleRowEventHandlers } from "./context";
import InfiniteRelayList from "./InfiniteRelayList";
import PeopleRow from "./PeopleRow";

const PAGE_SIZE = 20;

interface PeopleData {
  organization: {
    memberships: RelayPaginatedResponse<OrganizationMembership>;
  };
}

interface PeopleVariables {
  organizationId?: string;
  first?: number;
  filter?: MembershipFilter;
  last?: string;
}

interface PeopleTableProps {
  context: AdminPeopleContext;
  onlyCampaignId: string | false;
  nameSearch: string;
  rowEventHandlers: PeopleRowEventHandlers;
}
const PeopleTable: React.FC<PeopleTableProps> = ({
  context,
  nameSearch,
  onlyCampaignId,
  rowEventHandlers
}) => {
  const filter: MembershipFilter = {
    nameSearch: nameSearch === "" ? undefined : nameSearch,
    ...(onlyCampaignId ? { campaignId: onlyCampaignId } : {})
  };

  const campaignTitle =
    context.organization.campaigns.campaigns.find(
      (c) => c.id === onlyCampaignId
    )?.title || "";

  return (
    <Table>
      <TableHead>
        <TableCell>Name</TableCell>
        <TableCell>Email</TableCell>
        <TableCell>Role</TableCell>
        <TableCell>Autoassignment Status</TableCell>
        <TableCell>Actions</TableCell>
      </TableHead>
      <TableBody>
        <InfiniteRelayList<PeopleData, OrganizationMembership, PeopleVariables>
          query={GetOrganizationPeopleDocument}
          queryVars={{
            organizationId: context.organization.id,
            first: PAGE_SIZE,
            filter
          }}
          nextQueryVars={(cursor) => ({
            after: cursor,
            filter
          })}
          updateQuery={(nextResultDraft, { fetchMoreResult }) => {
            if (!fetchMoreResult) return;

            nextResultDraft.organization.memberships.edges = [
              ...nextResultDraft.organization.memberships.edges,
              ...fetchMoreResult.organization.memberships.edges
            ];
            nextResultDraft.organization.memberships.pageInfo =
              fetchMoreResult.organization.memberships.pageInfo;
          }}
          toRelay={(data) => data.organization.memberships}
          renderNode={(membership: OrganizationMembership) => (
            <PeopleRow
              membership={membership}
              context={context}
              handlers={rowEventHandlers}
            />
          )}
          keyFunc={(membership) => membership.user.id}
          empty={() => (
            <Empty
              title={`Nobody in ${
                onlyCampaignId ? `campaign ${campaignTitle}` : "organization"
              } yet`}
              icon={<PeopleIcon />}
            />
          )}
          cliffHanger={(hasMore, last) => {
            const loadingClause = hasMore ? "Loading more... " : "";
            const countClause = `${last.pageInfo.totalCount} ${
              last.pageInfo.totalCount === 1 ? "person" : "people"
            } found`;
            const searchClause = nameSearch
              ? `with search query '${nameSearch}'`
              : "Try the search (at the top) to filter by name.";
            const campaignClause = onlyCampaignId
              ? `in campaign '${campaignTitle}'`
              : `in organization ${context.organization.id}`;

            return (
              <div style={{ paddingTop: 8 }}>
                <span>{`${loadingClause}${countClause} ${campaignClause} ${searchClause}.`}</span>
              </div>
            );
          }}
        />
      </TableBody>
    </Table>
  );
};
export default PeopleTable;
