import { DateTime } from "./datetime";

export const isValidTimezone: (tzstr: string) => boolean = (tzstr) =>
  DateTime.local().setZone(tzstr).invalidReason !== "unsupported zone";

export const asUtc: (dt: Date) => DateTime = (dt) =>
  DateTime.fromJSDate(dt, { zone: "utc" });

export const getSendBeforeUtc = (
  zone: string,
  endHour: number,
  now?: DateTime
) =>
  (now ?? DateTime.local())
    .setZone(zone)
    .startOf("day")
    .set({ hour: endHour })
    .setZone("utc")
    .toISO();
