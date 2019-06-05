import { isBetweenTextingHours } from "../../lib";
import { getContactTimezone } from "../../lib/timezones";

export const isContactBetweenTextingHours = (contact, campaign) => {
  let timezoneData = null;

  if (
    contact.location &&
    contact.location.timezone &&
    contact.location.timezone.offset
  ) {
    const { hasDST, offset } = contact.location.timezone;
    timezoneData = { hasDST, offset };
  } else {
    const location = getContactTimezone(campaign, contact.location);
    if (location) {
      const timezone = location.timezone;
      if (timezone) {
        timezoneData = timezone;
      }
    }
  }

  const {
    textingHoursStart,
    textingHoursEnd,
    textingHoursEnforced
  } = campaign.organization;
  const config = {
    textingHoursStart,
    textingHoursEnd,
    textingHoursEnforced
  };

  if (campaign.overrideOrganizationTextingHours) {
    config.campaignTextingHours = {
      textingHoursStart,
      textingHoursEnd,
      textingHoursEnforced,
      timezone
    };
  }

  return isBetweenTextingHours(timezoneData, config);
};
