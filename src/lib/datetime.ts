/* eslint-disable no-restricted-imports */
import { DateTime as LuxonDateTime, Zone, ZoneOptions } from "luxon";

export { Interval } from "luxon";

// From: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
export const deprecatedTimezoneMap: Record<string, string> = {
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

export const parseIanaZone = (name: string) =>
  name ? deprecatedTimezoneMap[name.toLowerCase()] : name;

export class DateTime extends LuxonDateTime {
  /**
   * Wrap luxon's default setZone() to guarantee support for deprecated, but still valid, IANA
   * time zone names that Spoke uses.
   * @param zone - name of IANA time zone
   * @param options - luxon time zone options
   */
  setZone(zone: string | Zone, options?: ZoneOptions): DateTime {
    if (typeof zone === "string") {
      zone = parseIanaZone(zone);
    }
    return super.setZone(zone, options);
  }
}

export default DateTime;
