import { config } from "../../../config";
import thinky from "../thinky";

const { r } = thinky;

// This should be cached data for a campaign that will not change
// based on assignments or texter actions
// GET campaign-<campaignId>
//   archived
//   useDynamicAssignment
//   organization: {}
//   customFields
//   interactionSteps

// Only cache NON-archived campaigns
//   should clear when archiving is done
// TexterTodo.jsx uses:
// * interactionSteps
// * customFields
// * organization metadata (saved in organization.js instead)
// * campaignCannedResponses (saved in canned-responses.js instead)

const cacheKey = (id) => `${config.CACHE_PREFIX}campaign-${id}`;

const dbCustomFields = async (id) => {
  const campaignContact = await r
    .reader("campaign_contact")
    .where({ campaign_id: id })
    .first("custom_fields");

  if (campaignContact) {
    const customFields = JSON.parse(campaignContact.custom_fields || "{}");
    return Object.keys(customFields);
  }

  return [];
};

const dbInteractionSteps = async (id) => {
  return r.reader("interaction_step").select("*").where({
    campaign_id: id,
    is_deleted: false
  });
};

const clear = async (id) => {
  if (r.redis) {
    await r.redis.delAsync(cacheKey(id));
  }
};

const loadDeep = async (id) => {
  if (r.redis) {
    const campaign = await r.reader("all_campaign").where({ id }).first();
    if (campaign.is_archived) {
      // do not cache archived campaigns
      await clear(id);
      return campaign;
    }
    campaign.customFields = await dbCustomFields(id);
    campaign.interactionSteps = await dbInteractionSteps(id);
    // We should only cache organization data
    // if/when we can clear it on organization data changes
    // campaign.organization = await organizationCache.load(campaign.organization_id)

    await r.redis
      .multi()
      .set(cacheKey(id), JSON.stringify(campaign))
      .expire(cacheKey(id), 86400)
      .execAsync();
  }
  return null;
};

export const campaignCache = {
  clear,
  load: async (id) => {
    if (r.redis) {
      let campaignData = await r.redis.getAsync(cacheKey(id));
      if (!campaignData) {
        const campaignNoCache = await loadDeep(id);
        if (campaignNoCache) {
          return campaignNoCache;
        }
        campaignData = await r.redis.getAsync(cacheKey(id));
      }
      if (campaignData) {
        const campaignObj = JSON.parse(campaignData);
        const { customFields, interactionSteps } = campaignObj;
        delete campaignObj.customFields;
        delete campaignObj.interactionSteps;
        const campaign = { ...campaignObj };
        campaign.customFields = customFields;
        campaign.interactionSteps = interactionSteps;
        return campaign;
      }
    }
    return r.reader("all_campaign").where({ id }).first();
  },
  reload: loadDeep,
  dbCustomFields,
  dbInteractionSteps
};

export default campaignCache;
