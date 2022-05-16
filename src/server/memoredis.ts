import createMemoizer from "memoredis";

import { config } from "../config";
import logger from "../logger";

const opts = config.MEMOREDIS_URL
  ? {
      clientOpts: config.MEMOREDIS_URL,
      prefix: config.MEMOREDIS_PREFIX,
      logger
    }
  : { emptyMode: true, logger };

const memoizer = createMemoizer(opts);

const ONE_SECOND = 1000;
const THIRTY_SECONDS = ONE_SECOND * 30;
const ONE_MINUTE = ONE_SECOND * 60;
const ONE_HOUR = ONE_MINUTE * 60;
const ONE_DAY = ONE_HOUR * 24;
const ONE_WEEK = ONE_DAY * 7;

const cacheOptsPlain: Record<string, [string, number]> = {
  GetUser: ["get-user", ONE_HOUR],
  GetUserOrganization: ["get-user-organization", ONE_HOUR],
  CampaignHasUnassignedContacts: [
    "campaign-has-unassigned-contacts",
    THIRTY_SECONDS
  ],
  CampaignHasUnsentInitialMessages: [
    "campaign-has-unsent-initial-messages",
    THIRTY_SECONDS
  ],
  CampaignHasUnhandledMessages: [
    "campaign-has-unhandled-messages",
    THIRTY_SECONDS
  ],
  CampaignSentMessagesCount: ["campaign-sent-messages-count", ONE_MINUTE],
  CampaignReceivedMessagesCount: [
    "campaign-received-messages-count",
    ONE_MINUTE
  ],
  CampaignOptOutsCount: ["campaign-opt-outs-count", ONE_MINUTE],
  CampaignNeedsMessageOptOutsCount: [
    "campaign-needs-message-opt-outs-count",
    ONE_MINUTE
  ],
  CampaignTeams: ["campaign-teams", ONE_WEEK],
  CampaignsList: ["campaigns-list", ONE_WEEK],
  CampaignsListRelay: ["campaigns-list-relay", ONE_WEEK],
  CampaignOne: ["campaign-one", ONE_WEEK],
  CampaignInteractionSteps: ["campaign-interaction-steps", THIRTY_SECONDS],
  CampaignCannedResponses: ["campaign-canned-responses", THIRTY_SECONDS],
  InteractionStepChildren: ["interaction-step-children", THIRTY_SECONDS],
  InteractionStepSingleton: ["interaction-step-singleton", THIRTY_SECONDS],
  OrganizationTagList: ["organization-tag-list", ONE_WEEK],
  OrganizationEscalatedTagList: ["organization-escalated-tag-list", ONE_WEEK],
  OrganizationSingleTon: ["organization-singleton", ONE_HOUR],
  UserOrganizations: ["user-organizations", ONE_WEEK],
  UserOrganizationRoles: ["user-organization-roles", ONE_WEEK],
  CampaignOrganizationId: ["campaign-organiation-id", ONE_WEEK],
  FullfillAssignmentLock: ["fulfull-assignment-lock", ONE_MINUTE * 2],
  AssignmentCompleteLock: ["assignment-complete-lock", THIRTY_SECONDS],
  GetUsers: ["get-users", ONE_MINUTE * 5],
  MyCurrentAssignmentTargets: ["my-current-assignment-targets", ONE_SECOND * 5],
  PercentUnhandledReplies: ["percent-unhandled-replies", ONE_SECOND * 5],
  CountMessagedContacts: ["count-messaged-contacts", ONE_MINUTE],
  CountNeedsMessageContacts: ["count-needs-message-contacts", ONE_MINUTE]
};

const cacheOpts = Object.fromEntries(
  Object.entries(cacheOptsPlain).map(([name, [key, ttl]]) => [
    name,
    { key, ttl }
  ])
);

export { memoizer, cacheOpts };
