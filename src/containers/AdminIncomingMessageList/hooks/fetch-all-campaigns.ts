import { ApolloError } from "@apollo/client";
import { Campaign, useFetchCampaignPageLazyQuery } from "@spoke/spoke-codegen";
import { useEffect, useState } from "react";

type CampaignResult = Pick<Campaign, "id" | "title">;

const PAGE_SIZE = 10;

export const useFetchAllCampaigns = (
  organizationId: string,
  isArchived = false
) => {
  const [getCampaigns] = useFetchCampaignPageLazyQuery({
    fetchPolicy: "network-only"
  });

  const fetchAll = async (): Promise<{
    error?: ApolloError;
    data?: CampaignResult[];
  }> => {
    let offset = 0;
    let total = 0;
    let campaigns: CampaignResult[] = [];
    do {
      const results = await getCampaigns({
        variables: {
          cursor: { offset, limit: PAGE_SIZE },
          organizationId,
          campaignsFilter: isArchived !== undefined ? { isArchived } : undefined
        }
      });
      if (results.error) return { error: results.error, data: undefined };
      if (results.data?.campaigns?.__typename === "PaginatedCampaigns") {
        const { pageInfo, campaigns: newCampaigns } = results.data.campaigns;
        campaigns = campaigns.concat(
          newCampaigns.map(({ id, title }) => ({ id, title }))
        );
        offset += PAGE_SIZE;
        total = pageInfo.total;
      }
    } while (offset < total);

    return { error: undefined, data: campaigns };
  };

  const [loading, setLoading] = useState(false);
  const [campaignsRes, setCampaignsRes] = useState<
    CampaignResult[] | undefined
  >(undefined);
  const [errorRes, setErrorRes] = useState<ApolloError | undefined>(undefined);

  useEffect(() => {
    setErrorRes(undefined);
    setLoading(true);
    fetchAll()
      .then(({ error, data }) => {
        setErrorRes(error);
        setCampaignsRes(data);
      })
      .catch((err) => setErrorRes(err))
      .then(() => setLoading(false));
  }, [organizationId, isArchived]);

  return { loading, campaigns: campaignsRes, error: errorRes };
};

export default useFetchAllCampaigns;
