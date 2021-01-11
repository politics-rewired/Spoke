import { DateTime, Interval } from "luxon";

// From: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
const depractedTimezoneMap = {
  "us/alaska": "America/Anchorage",
  "us/aleutian": "America/Adak",
  "us/arizona": "America/Phoenix",
  "us/central": "America/Chicago",
  "us/east-indiana": "America/Indiana/Indianapolis",
  "us/eastern": "America/New_York",
  "us/hawaii": "Pacific/Honolulu",
  "us/indiana-starke": "America/Indiana/Knox",
  "us/michigan": "America/Detroit",
  "us/mountain": "America/Denver",
  "us/pacific": "America/Los_Angeles",
  "us/samoa": "Pacific/Pago_Pago"
};

export const parseIanaZone = (name) =>
  depractedTimezoneMap[name.toLowerCase()] || name;

/**
 * Returns true if it is currently between the start and end hours in the specified timezone.
 *
 * @param {string} timezone The timezone in which to evaluate
 * @param {number} starthour Interval starting hour in 24-hour format
 * @param {number} endHour Interval ending hour in 24-hour format
 */
export const isNowBetween = (timezone, starthour, endHour) => {
  const campaignTime = DateTime.local()
    .setZone(parseIanaZone(timezone))
    .startOf("day");

  return Interval.fromDateTimes(
    campaignTime.set({ hour: starthour }),
    campaignTime.set({ hour: endHour })
  ).contains(DateTime.local());
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
