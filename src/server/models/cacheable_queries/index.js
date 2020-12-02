import { campaignCache } from "./campaign";
import { campaignContactCache } from "./campaign-contact";
import { cannedResponseCache } from "./canned-response";
import { optOutCache } from "./opt-out";
import { organizationCache } from "./organization";

export * from "./user";

const cacheableData = {
  campaign: campaignCache,
  campaignContact: campaignContactCache,
  cannedResponse: cannedResponseCache,
  optOut: optOutCache,
  organization: organizationCache
};

export { cacheableData };
