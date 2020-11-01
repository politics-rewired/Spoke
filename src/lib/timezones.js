import moment from "moment-timezone";

/**
 * Returns true if it is currently between the start and end hours in the specified timezone.
 *
 * @param {string} timezone The timezone in which to evaluate
 * @param {number} starthour Interval starting hour in 24-hour format
 * @param {number} endHour Interval ending hour in 24-hour format
 */
export const isNowBetween = (timezone, starthour, endHour) => {
  const campaignTime = moment().tz(timezone).startOf("day");

  const startTime = campaignTime.clone().hour(starthour);
  const endTime = campaignTime.clone().hour(endHour);
  return moment().isBetween(startTime, endTime);
};

/**
 * Return true if, in the contact's timezone, it is currently within the campaign texting hours.
 *
 * @param {object} contact GraphQL-type contact
 * @param {object} campaign GraphQL-type campaign type
 */
export const isContactNowWithinCampaignHours = (contact, campaign) => {
  const timezone = contact.timezone || campaign.timezone;
  const { textingHoursStart, textingHoursEnd } = campaign;

  return isNowBetween(timezone, textingHoursStart, textingHoursEnd);
};
