import type { Memoizer, MemoizerOpts } from "memoredis";
import createMemoizer from "memoredis";

import { config } from "../config";

const ONE_SECOND = 1000;
const THIRTY_SECONDS = ONE_SECOND * 30;
const ONE_MINUTE = ONE_SECOND * 60;
const ONE_HOUR = ONE_MINUTE * 60;
const ONE_DAY = ONE_HOUR * 24;
const ONE_WEEK = ONE_DAY * 7;

type CacheOpt = {
  key: string;
  ttl: number;
};

export class MemoizeHelper {
  private static _instance: MemoizeHelper;

  private static _memoizer: Memoizer;

  public static async getMemoizer(): Promise<Memoizer> {
    if (!this._instance || !this._memoizer) {
      const opts: MemoizerOpts = config.CACHING_URL
        ? {
            clientOpts: { url: config.CACHING_URL },
            prefix: config.CACHING_PREFIX
          }
        : { emptyMode: true };
      this._instance = new this();
      this._memoizer = await createMemoizer(opts);
    }

    return this._memoizer;
  }

  public static hasBucket(bucket: string) {
    const buckets = config.CACHING_BUCKETS.split(",").map((b: string) =>
      b.trim()
    );

    return buckets.includes(bucket);
  }
}

export const cacheOpts: Record<string, CacheOpt> = {
  GetUser: { key: "get-user", ttl: ONE_HOUR },
  GetUserOrganization: { key: "get-user-organization", ttl: ONE_HOUR },
  CampaignHasUnassignedContacts: {
    key: "campaign-has-unassigned-contacts",
    ttl: THIRTY_SECONDS
  },
  CampaignHasUnsentInitialMessages: {
    key: "campaign-has-unsent-initial-messages",
    ttl: THIRTY_SECONDS
  },
  CampaignHasUnhandledMessages: {
    key: "campaign-has-unhandled-messages",
    ttl: THIRTY_SECONDS
  },
  CampaignSentMessagesCount: {
    key: "campaign-sent-messages-count",
    ttl: ONE_MINUTE
  },
  CampaignReceivedMessagesCount: {
    key: "campaign-received-messages-count",
    ttl: ONE_MINUTE
  },
  CampaignOptOutsCount: { key: "campaign-opt-outs-count", ttl: ONE_MINUTE },
  CampaignNeedsMessageOptOutsCount: {
    key: "campaign-needs-message-opt-outs-count",
    ttl: ONE_MINUTE
  },
  CampaignTeams: { key: "campaign-teams", ttl: ONE_WEEK },
  CampaignsList: { key: "campaigns-list", ttl: ONE_WEEK },
  CampaignsListRelay: { key: "campaigns-list-relay", ttl: ONE_WEEK },
  CampaignOne: { key: "campaign-one", ttl: ONE_WEEK },
  CampaignInteractionSteps: {
    key: "campaign-interaction-steps",
    ttl: THIRTY_SECONDS
  },
  CampaignCannedResponses: {
    key: "campaign-canned-responses",
    ttl: THIRTY_SECONDS
  },
  InteractionStepChildren: {
    key: "interaction-step-children",
    ttl: THIRTY_SECONDS
  },
  InteractionStepSingleton: {
    key: "interaction-step-singleton",
    ttl: THIRTY_SECONDS
  },
  OrganizationTagList: { key: "organization-tag-list", ttl: ONE_WEEK },
  OrganizationEscalatedTagList: {
    key: "organization-escalated-tag-list",
    ttl: ONE_WEEK
  },
  Organization: { key: "organization", ttl: ONE_WEEK },
  OrganizationSingleTon: { key: "organization-singleton", ttl: ONE_HOUR },
  UserOrganizations: { key: "user-organizations", ttl: ONE_WEEK },
  UserOrganizationRoles: { key: "user-organization-roles", ttl: ONE_WEEK },
  CampaignOrganizationId: { key: "campaign-organiation-id", ttl: ONE_WEEK },
  FullfillAssignmentLock: {
    key: "fulfull-assignment-lock",
    ttl: ONE_MINUTE * 2
  },
  AssignmentCompleteLock: {
    key: "assignment-complete-lock",
    ttl: THIRTY_SECONDS
  },
  GetUsers: { key: "get-users", ttl: ONE_MINUTE * 5 },
  MyCurrentAssignmentTargets: {
    key: "my-current-assignment-targets",
    ttl: ONE_SECOND * 5
  },
  PercentUnhandledReplies: {
    key: "percent-unhandled-replies",
    ttl: ONE_SECOND * 5
  },
  CountMessagedContacts: { key: "count-messaged-contacts", ttl: ONE_MINUTE },
  CountNeedsMessageContacts: {
    key: "count-needs-message-contacts",
    ttl: ONE_MINUTE
  },
  DeliverabilityStats: { key: "campaign-deliverability-stats", ttl: ONE_MINUTE }
};

export default MemoizeHelper;
