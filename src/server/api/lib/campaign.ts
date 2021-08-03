/* eslint-disable import/prefer-default-export */
import isNil from "lodash/isNil";

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

    if (!isNil(isArchived)) {
      query.where({ is_archived: isArchived });
    }

    const pagerOptions = { first, after };
    return formatPage(query, pagerOptions);
  },
  cacheOpts.CampaignsListRelay
);

interface DeliverabilityStatRow {
  count: string;
  send_status: string;
  error_codes: string[] | null;
}

export const getDeliverabilityStats = async (campaignId: number) => {
  const rows = await r.reader
    .raw(
      `
        select count(*), send_status, coalesce(error_codes, '{}') as error_codes
        from message
        join campaign_contact on campaign_contact.id = message.campaign_contact_id
        where campaign_contact.campaign_id = ?
          and is_from_contact = false
        group by 2, 3
      `,
      [campaignId]
    )
    .then((res: { rows: DeliverabilityStatRow[] }) => {
      // The `count` column is returned as a string so we parse it ourselves
      return res.rows.map(({ count, ...row }) => ({
        ...row,
        count: parseInt(count, 10)
      }));
    });

  const result = {
    deliveredCount: rows.find((o) => o.send_status === "DELIVERED")?.count || 0,
    sendingCount: rows.find((o) => o.send_status === "SENDING")?.count || 0,
    sentCount: rows.find((o) => o.send_status === "SENT")?.count || 0,
    errorCount:
      rows
        .filter((o) => o.send_status === "ERROR")
        .reduce((a, b) => ({ count: a.count + b.count }), { count: 0 }).count ||
      0,
    specificErrors: rows
      .filter((o) => o.send_status === "ERROR")
      .map((o) => ({
        errorCode:
          o.error_codes && o.error_codes.length > 0 ? o.error_codes[0] : null,
        count: o.count
      }))
  };

  return result;
};
