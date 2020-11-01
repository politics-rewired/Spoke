import { r } from "..";
import { config } from "../../../config";

// Datastructure:
// * regular GET/SET with JSON ordered list of the objects {id,title,text}
// * keyed by campaignId-userId pairs -- userId is '' for global campaign records
// Requirements:
// * needs an order
// * needs to get by campaignId-userId pairs

const cacheKey = (campaignId, userId) =>
  `${config.CACHE_PREFIX}canned-${campaignId}-${userId | ""}`;

export const cannedResponseCache = {
  clearQuery: async ({ campaignId, userId }) => {
    if (r.redis) {
      await r.redis.delAsync(cacheKey(campaignId, userId));
    }
  },
  query: async ({ campaignId, userId }) => {
    if (r.redis) {
      const cannedData = await r.redis.getAsync(cacheKey(campaignId, userId));
      if (cannedData) {
        return JSON.parse(cannedData);
      }
    }
    const dbResult = await r
      .reader("canned_response")
      .where({
        campaign_id: parseInt(campaignId),
        user_id: parseInt(userId) || null
      })
      .orderBy("title");
    if (r.redis) {
      const cacheData = dbResult.map(cannedRes => ({
        id: cannedRes.id,
        title: cannedRes.title,
        text: cannedRes.text,
        user_id: cannedRes.user_id
      }));
      await r.redis
        .multi()
        .set(cacheKey(campaignId, userId), JSON.stringify(cacheData))
        .expire(cacheKey(campaignId, userId), 86400)
        .execAsync();
    }
    return dbResult;
  }
};
