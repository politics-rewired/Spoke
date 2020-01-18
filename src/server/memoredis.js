import createMemoizer from "memoredis";

const memoizer = createMemoizer({ clientOpts: config.REDIS_URL });

const ONE_SECOND = 1000;
const THIRTY_SECONDS = ONE_SECOND * 30;
const ONE_MINUTE = ONE_SECOND * 60;
const ONE_HOUR = ONE_MINUTE * 60;
const ONE_DAY = ONE_HOUR * 24;
const ONE_WEEK = ONE_DAY * 7;

const cacheOpts = {
  // CampaignHasUnassignedContacts: [
  //   "campaign-has-unassigned-contacts",
  //   THIRTY_SECONDS
  // ],
  // CampaignHasUnsentInitialMessages: [
  //   "campaign-has-unsent-initial-messages",
  //   THIRTY_SECONDS
  // ],
  // CampaignHasUnhandledMessages: [
  //   "campaign-has-unhandled-messages",
  //   THIRTY_SECONDS
  // ],
  // CampaignSentMessagesCount: ["campaign-sent-messages-count", THIRTY_SECONDS],
  // CampaignReceivedMessagesCount: [
  //   "campaign-received-messages-count",
  //   THIRTY_SECONDS
  // ],
  // CampaignContactsCount: ["campaign-contacts-count", ONE_WEEK], // will be invalidate
  // CampaignCannedResponses: ["campaign-canned-responses", ONE_WEEK], // will be invalidated,
  AuthAccessRequired: ["auth-access-required", ONE_WEEK] // will be invalidated
};

export { memoizer, cacheOpts };
