import useIntersectionObserverRef from "@rooks/use-intersection-observer-ref";
import type {
  GetAdminCampaignsQuery,
  GetAdminCampaignsQueryVariables
} from "@spoke/spoke-codegen";
import { useGetAdminCampaignsQuery } from "@spoke/spoke-codegen";
import React from "react";

import { CampaignsFilter } from "../../api/campaign";
import LoadingIndicator from "../../components/LoadingIndicator";
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

  return (
    <div>
      {error && <p>Error fetching campaigns: {error}</p>}
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
