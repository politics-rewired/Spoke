import DataLoader from "dataloader";
import { Knex } from "knex";
import groupBy from "lodash/groupBy";
import { RedisClient } from "redis";

import type { SpokeContext } from "../contexts";
import { cacheableData } from "./cacheable_queries";
import datawarehouse from "./datawarehouse";
import thinky from "./thinky";

export interface LoadOptions {
  idKey: string;
  cacheObj: any;
}

interface RethinkQuery {
  k: Knex;
  knex: Knex;
  reader: Knex;
  redis?: RedisClient;
}

interface ThinkyConnection {
  config: Knex.Config | string;
  k: Knex;
  r: RethinkQuery;
}

const { r } = thinky as ThinkyConnection;

const LOADER_DEFAULTS: LoadOptions = {
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
const createLoader = <T = unknown>(
  context: SpokeContext,
  tableName: string,
  options: Partial<LoadOptions> = {}
) => {
  const { db } = context;
  const { idKey, cacheObj } = { ...LOADER_DEFAULTS, ...options };
  return new DataLoader<string, T>(async (keys) => {
    // Try Redis cache if available (this approach does not reduce round trips)
    if (cacheObj && cacheObj.load) {
      return keys.map(async (key) => cacheObj.load(key));
    }

    // Make batch request and return in the order requested by the loader
    const docs = await db.reader(tableName).whereIn(idKey, keys);
    const docsById = groupBy(docs, idKey);
    return keys.map((key) => docsById[key] && docsById[key][0]);
  });
};

const createLoaders = (context: SpokeContext) => ({
  assignment: createLoader(context, "assignment"),
  assignmentRequest: createLoader(context, "assignment_request"),
  campaign: createLoader(context, "campaign", {
    cacheObj: cacheableData.campaign
  }),
  campaignContact: createLoader(context, "campaign_contact"),
  campaignContactTag: createLoader(context, "campaign_contact_tag"),
  campaignTeam: createLoader(context, "campaign_team"),
  cannedResponse: createLoader(context, "canned_response"),
  interactionStep: createLoader(context, "interaction_step"),
  invite: createLoader(context, "invite"),
  jobRequest: createLoader(context, "job_request"),
  linkDomain: createLoader(context, "link_domain"),
  log: createLoader(context, "log"),
  message: createLoader(context, "message"),
  messagingService: createLoader(context, "messaging_service"),
  messagingServiceStick: createLoader(context, "messaging_service_stick"),
  optOut: createLoader(context, "opt_out"),
  organization: createLoader(context, "organization", {
    cacheObj: cacheableData.organization
  }),
  pendingMessagePart: createLoader(context, "pending_message_part"),
  questionResponse: createLoader(context, "question_response"),
  tag: createLoader(context, "tag"),
  team: createLoader(context, "team"),
  teamEscalationTags: createLoader(context, "team_escalation_tags"),
  unhealthyLinkDomain: createLoader(context, "unhealthy_link_domain"),
  user: createLoader(context, "user"),
  userCell: createLoader(context, "user_cell"),
  userOrganization: createLoader(context, "user_organization"),
  userTeam: createLoader(context, "user_team"),
  zipCode: createLoader(context, "zip_code", { idKey: "zip" })
});

export { createLoaders, r, cacheableData, datawarehouse };
