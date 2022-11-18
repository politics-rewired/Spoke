import useIntersectionObserverRef from "@rooks/use-intersection-observer-ref";
import type {
  CampaignsFilter,
  GetAdminCampaignsQuery,
  GetAdminCampaignsQueryVariables
} from "@spoke/spoke-codegen";
import { useGetAdminCampaignsQuery } from "@spoke/spoke-codegen";
import React from "react";

import LoadingIndicator from "../../../components/LoadingIndicator";
import { useAuthzContext } from "../../AuthzProvider";
import { isCampaignGroupsPermissionError } from "../utils";
import CampaignList from "./CampaignList";

interface Props {
  organizationId: string;
  pageSize: number;
  campaignsFilter: CampaignsFilter;
  isAdmin: boolean;
  startOperation: (...args: any[]) => any;
  archiveCampaign: (...args: any[]) => any;
  unarchiveCampaign: (...args: any[]) => any;
}

const CampaignListLoader: React.FC<Props> = (props) => {
  const {
    organizationId,
    campaignsFilter,
    pageSize,
    isAdmin,
    startOperation,
    archiveCampaign,
    unarchiveCampaign
  } = props;
  const { data, loading, error, fetchMore } = useGetAdminCampaignsQuery({
    variables: { organizationId, limit: pageSize, filter: campaignsFilter },
    fetchPolicy: "network-only"
  });
  const authz = useAuthzContext();

  const callback: IntersectionObserverCallback = (entries) => {
    if (entries && entries[0]) {
      const { isIntersecting } = entries[0];
      const hasNextPage =
        data?.organization?.campaignsRelay.pageInfo.hasNextPage ?? false;
      if (isIntersecting && hasNextPage && !loading) {
        const cursor = data?.organization?.campaignsRelay.pageInfo.endCursor;
        fetchMore<GetAdminCampaignsQuery, GetAdminCampaignsQueryVariables>({
          variables: {
            organizationId,
            limit: pageSize,
            filter: campaignsFilter,
            after: cursor
          },
          updateQuery: (previousResult, { fetchMoreResult }) => {
            if (!fetchMoreResult) return previousResult;

            fetchMoreResult.organization!.campaignsRelay.edges = [
              ...previousResult.organization!.campaignsRelay.edges,
              ...fetchMoreResult.organization!.campaignsRelay.edges
            ];
            return { ...fetchMoreResult };
          }
        });
      }
    }
  };

  const [loadingRef] = useIntersectionObserverRef(callback, {
    root: null,
    rootMargin: "0px",
    threshold: 1.0
  });

  const campaigns =
    data?.organization?.campaignsRelay.edges?.map(({ node }) => node) ?? [];

  // authz.isSupervol will be true for owner and admin so check NOT admin instead
  const isOnlySupervol = !authz.isAdmin;
  const unexpectedErrors = [
    ...(error?.graphQLErrors.filter(
      (gqlError) =>
        !(isOnlySupervol && isCampaignGroupsPermissionError(gqlError))
    ) ?? []),
    ...(error?.clientErrors ?? []),
    ...(error?.networkError ? [error?.networkError] : [])
  ];
  return (
    <div>
      {unexpectedErrors.length > 0 && (
        <div>
          <p>Error(s) fetching campaigns:</p>
          <ul>
            {unexpectedErrors.map((err, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <li key={i}>{err.message}</li>
            ))}
          </ul>
        </div>
      )}
      <CampaignList
        organizationId={organizationId}
        campaigns={campaigns}
        isAdmin={isAdmin}
        startOperation={startOperation}
        archiveCampaign={archiveCampaign}
        unarchiveCampaign={unarchiveCampaign}
      />
      {loading && <LoadingIndicator />}
      <div ref={loadingRef} />
    </div>
  );
};

export default CampaignListLoader;
