/* eslint-disable import/prefer-default-export */
import { Campaign, CampaignsFilter } from "../../../api/campaign";
import { RelayPaginatedResponse } from "../../../api/pagination";
import { cacheOpts, memoizer } from "../../memoredis";
import { r } from "../../models";
import { formatPage } from "./pagination";

interface GetCampaignsOptions {
  first?: number;
  after?: string;
  filter?: CampaignsFilter;
}

type DoGetCampaigns = (
  options: GetCampaignsOptions
) => Promise<RelayPaginatedResponse<Campaign>>;

export const getCampaigns: DoGetCampaigns = memoizer.memoize(
  async (options: GetCampaignsOptions) => {
    const { after, first, filter = {} } = options;
    const { organizationId, campaignId, isArchived } = filter || {};

    const query = r.reader("campaign").select("*");

    // Filter options
    if (organizationId) {
      query.where({ organization_id: organizationId });
    }

    if (campaignId) {
      query.where({ id: campaignId });
    }

    if (isArchived) {
      query.where({ is_archived: true });
    }

    const pagerOptions = { first, after };
    return formatPage(query, pagerOptions);
  },
  cacheOpts.CampaignsList
);
