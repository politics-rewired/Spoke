import { config } from "../../../config";
import logger from "../../../logger";
import thinky from "../thinky";

const { r } = thinky;

// STRUCTURE
// maybe HASH by organization, so optout-<organization_id> has a <cell> key

const orgCacheKey = orgId =>
  config.OPTOUTS_SHARE_ALL_ORGS
    ? `${config.CACHE_PREFIX}optouts`
    : `${config.CACHE_PREFIX}optouts-${orgId}`;

const sharingOptOuts = config.OPTOUTS_SHARE_ALL_ORGS;

const loadMany = async organizationId => {
  if (r.redis) {
    let dbQuery = r.reader("opt_out").select("cell");
    if (!sharingOptOuts) {
      dbQuery = dbQuery.where("organization_id", organizationId);
    }
    const dbResult = await dbQuery;
    const cellOptOuts = dbResult.map(rec => rec.cell);
    const hashKey = orgCacheKey(organizationId);
    // save 100 at a time
    for (
      let i100 = 0, l100 = Math.ceil(cellOptOuts.length / 100);
      i100 < l100;
      i100 += 1
    ) {
      await r.redis.saddAsync(
        hashKey,
        cellOptOuts.slice(100 * i100, 100 * i100 + 100)
      );
    }
    await r.redis.expire(hashKey, 86400);
    logger.debug(`CACHE: Loaded optouts for ${organizationId}`);
  }
};

export const optOutCache = {
  clearQuery: async ({ cell, organizationId }) => {
    // remove cache by organization
    // (if no cell is present, then clear whole query of organization)
    if (r.redis) {
      if (cell) {
        await r.redis.sdelAsync(orgCacheKey(organizationId), cell);
      } else {
        await r.redis.delAsync(orgCacheKey(organizationId));
      }
    }
  },
  query: async ({ cell, organizationId }) => {
    // return optout result by db or by cache.
    // for a particular organization, if the org Id is NOT cached
    // then cache the WHOLE set of opt-outs for organizationId at once
    // and expire them in a day.
    const accountingForOrgSharing = !sharingOptOuts
      ? { organization_id: organizationId, cell }
      : { cell };

    if (r.redis) {
      const hashKey = orgCacheKey(organizationId);
      const [exists, isMember] = await r.redis
        .multi()
        .exists(hashKey)
        .sismember(hashKey, cell)
        .execAsync();
      if (exists) {
        return isMember;
      }
      // note NOT awaiting this -- it should run in background
      // ideally not blocking the rest of the request
      loadMany(organizationId);
    }
    const dbResult = await r
      .reader("opt_out")
      .select("cell")
      .where(accountingForOrgSharing)
      .limit(1);
    return dbResult.length > 0;
  },
  save: async ({ cell, organizationId, assignmentId, reason }) => {
    const updateQueryParams = { "campaign_contact.cell": cell };
    if (!sharingOptOuts) {
      updateQueryParams["campaign.organization_id"] = organizationId;
    }

    if (r.redis) {
      const hashKey = orgCacheKey(organizationId);
      const exists = await r.redis.existsAsync(hashKey);
      if (exists) {
        await r.redis.saddAsync(hashKey, cell);
      }
    }
    // database
    try {
      await r.knex("opt_out").insert({
        assignment_id: assignmentId,
        organization_id: organizationId,
        reason_code: reason,
        cell
      });
    } catch (error) {
      logger.error("Error creating opt-out: ", error);
    }

    // update all organization's active campaigns as well
    // TODO - MySQL Specific. Getting contactIds can be done in subquery
    const contactIds = await r
      .reader("campaign_contact")
      .leftJoin("campaign", "campaign_contact.campaign_id", "campaign.id")
      .where(updateQueryParams)
      .pluck("campaign_contact.id");
    await r
      .knex("campaign_contact")
      .whereIn("id", contactIds)
      .update({
        is_opted_out: true
      });
  },
  loadMany
};

export default optOutCache;
