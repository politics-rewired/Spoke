import DataLoader from "dataloader";
import groupBy from "lodash/groupBy";

import { cacheableData } from "./cacheable_queries";
import datawarehouse from "./datawarehouse";
import thinky from "./thinky";

const { r } = thinky;

const LOADER_DEFAULTS = {
  idKey: "id",
  cacheObj: undefined
};

/**
 * A DataLoader a) batches requests to reduce round trips to database, and b) caches results.
 * This returns a DataLoader to fetch records by their primary ID (default `id`).
 *
 * @param {string} tableName The database table name to load from
 * @param {object} options Additional loader options
 */
const createLoader = (tableName, options = {}) => {
  const { idKey, cacheObj } = { ...LOADER_DEFAULTS, ...options };
  return new DataLoader(async (keys) => {
    // Try Redis cache if available (this approach does not reduce round trips)
    if (cacheObj && cacheObj.load) {
      return keys.map(async (key) => cacheObj.load(key));
    }

    // Make batch request and return in the order requested by the loader
    const docs = await r.reader(tableName).whereIn(idKey, keys);
    const docsById = groupBy(docs, idKey);
    return keys.map((key) => docsById[key] && docsById[key][0]);
  });
};

const createLoaders = () => ({
  assignment: createLoader("assignment"),
  assignmentRequest: createLoader("assignment_request"),
  campaign: createLoader("campaign", { cacheObj: cacheableData.campaign }),
  campaignContact: createLoader("campaign_contact"),
  campaignContactTag: createLoader("campaign_contact_tag"),
  campaignTeam: createLoader("campaign_team"),
  cannedResponse: createLoader("canned_response"),
  interactionStep: createLoader("interaction_step"),
  invite: createLoader("invite"),
  jobRequest: createLoader("job_request"),
  linkDomain: createLoader("link_domain"),
  log: createLoader("log"),
  message: createLoader("message"),
  messagingService: createLoader("messaging_service"),
  messagingServiceStick: createLoader("messaging_service_stick"),
  optOut: createLoader("opt_out"),
  organization: createLoader("organization", {
    cacheObj: cacheableData.organization
  }),
  pendingMessagePart: createLoader("pending_message_part"),
  questionResponse: createLoader("question_response"),
  tag: createLoader("tag"),
  team: createLoader("team"),
  teamEscalationTags: createLoader("team_escalation_tags"),
  unhealthyLinkDomain: createLoader("unhealthy_link_domain"),
  user: createLoader("user"),
  userCell: createLoader("user_cell"),
  userOrganization: createLoader("user_organization"),
  userTeam: createLoader("user_team"),
  zipCode: createLoader("zip_code", { idKey: "zip" })
});

export { createLoaders, r, cacheableData, datawarehouse };
