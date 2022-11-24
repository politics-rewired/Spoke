import chunk from "lodash/chunk";

import { config } from "../../../config";
import logger from "../../../logger";
import thinky from "../thinky";

const { r } = thinky;

// STRUCTURE
// maybe HASH by organization, so optout-<organization_id> has a <cell> key

const orgCacheKey = (orgId) =>
  config.OPTOUTS_SHARE_ALL_ORGS
    ? `${config.CACHE_PREFIX}optouts`
    : `${config.CACHE_PREFIX}optouts-${orgId}`;

const CHUNK_SIZE = 100;

const sharingOptOuts = config.OPTOUTS_SHARE_ALL_ORGS;

const loadMany = async (organizationId) => {
  if (r.redis) {
    let dbQuery = r.reader("opt_out").select("cell");
    if (!sharingOptOuts) {
      dbQuery = dbQuery.where("organization_id", organizationId);
    }
    const dbResult = await dbQuery;
    const cellOptOuts = dbResult.map((rec) => rec.cell);
    const hashKey = orgCacheKey(organizationId);
    // save CHUNK_SIZE at a time
    for (
      let i100 = 0, l100 = Math.ceil(cellOptOuts.length / CHUNK_SIZE);
      i100 < l100;
      i100 += 1
    ) {
      await r.redis.saddAsync(
        hashKey,
        cellOptOuts.slice(CHUNK_SIZE * i100, CHUNK_SIZE * i100 + CHUNK_SIZE)
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
  save: async (
    // eslint-disable-next-line default-param-last
    trx = r.knex,
    { cell, organizationId, assignmentId, reason }
  ) => {
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
    const [opttedOutId] = await trx("opt_out")
      .insert({
        assignment_id: assignmentId,
        organization_id: organizationId,
        reason_code: reason,
        cell
      })
      .returning(["id"]);

    const optOutId = opttedOutId.id;

    // update all organization's active campaigns as well
    // TODO - MySQL Specific. Getting contactIds can be done in subquery
    const contactIds = await r
      .reader("campaign_contact")
      .leftJoin("campaign", "campaign_contact.campaign_id", "campaign.id")
      .where(updateQueryParams)
      .pluck("campaign_contact.id");

    await trx("campaign_contact").whereIn("id", contactIds).update({
      is_opted_out: true
    });

    return optOutId;
  },
  saveMany: async (
    // eslint-disable-next-line default-param-last
    trx = r.knex,
    { cells: cellsList, organizationId, assignmentId, reason }
  ) => {
    const cellsChunks = chunk(cellsList, CHUNK_SIZE);

    for (const cells of cellsChunks) {
      if (r.redis) {
        const hashKey = orgCacheKey(organizationId);
        const exists = await r.redis.existsAsync(hashKey);
        if (exists) {
          await r.redis.saddAsync(hashKey, cells);
        }
      }

      const optOuts = cells.map((cell) => ({
        cell,
        assignment_id: assignmentId,
        organization_id: organizationId,
        reason_code: reason
      }));

      // workaround for rethink knex adapter using knex 0.17
      const knexInsert = trx("opt_out").insert(optOuts);
      const onConflictInsert = `${knexInsert.toString()} on conflict(organization_id, cell) do update set updated_at = now()`;
      await trx.raw(onConflictInsert);

      const contactIdsQuery = r
        .reader("campaign_contact")
        .leftJoin("campaign", "campaign_contact.campaign_id", "campaign.id")
        .whereIn("campaign_contact.cell", cells)
        .pluck("campaign_contact.id");

      if (!sharingOptOuts)
        contactIdsQuery.where({ "campaign.organization_id": organizationId });

      const contactIds = await contactIdsQuery;

      await trx("campaign_contact").whereIn("id", contactIds).update({
        is_opted_out: true
      });
    }
  },
  deleteMany: async (
    // eslint-disable-next-line default-param-last
    trx = r.knex,
    { cells: cellsList, organizationId }
  ) => {
    const cellsChunks = chunk(cellsList, CHUNK_SIZE);

    for (const cells of cellsChunks) {
      if (r.redis) {
        const hashKey = orgCacheKey(organizationId);
        const exists = await r.redis.existsAsync(hashKey);
        if (exists) {
          await r.redis.srem(hashKey, cells);
        }
      }

      const deleteQuery = trx("opt_out").whereIn("cell", cells);

      if (!sharingOptOuts)
        deleteQuery.where({ organization_id: organizationId });

      await deleteQuery.delete();
    }
  },
  loadMany
};

export default optOutCache;
