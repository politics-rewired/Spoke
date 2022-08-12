import { DateTime, Interval } from "./datetime";

export const timezones = [
  "US/Alaska",
  "US/Aleutian",
  "US/Arizona",
  "US/Central",
  "US/East-Indiana",
  "US/Eastern",
  "US/Hawaii",
  "US/Indiana-Starke",
  "US/Michigan",
  "US/Mountain",
  "US/Pacific",
  "US/Samoa",
  "America/Puerto_Rico",
  "America/Virgin"
];

/**
 * Returns true if it is currently between the start and end hours in the specified timezone.
 *
 * @param {string} timezone The timezone in which to evaluate
 * @param {number} starthour Interval starting hour in 24-hour format
 * @param {number} endHour Interval ending hour in 24-hour format
 */
export const isNowBetween = (timezone, starthour, endHour) => {
  const campaignTime = DateTime.local().setZone(timezone).startOf("day");

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
