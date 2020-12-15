import { DateTime } from "luxon";

export const getProcessEnvTz: () => string = () =>
  typeof window === "undefined" ? process.env.TZ : window.TZ;

export const getProcessEnvDstReferenceTimezone: () => string = () =>
  typeof window === "undefined"
    ? process.env.DST_REFERENCE_TIMEZONE
    : window.DST_REFERENCE_TIMEZONE;

export const isValidTimezone: (tzstr: string) => boolean = (tzstr) =>
  DateTime.local().setZone(tzstr).invalidReason !== "unsupported zone";

export const asUtc: (dt: Date) => DateTime = (dt) =>
  DateTime.fromJSDate(dt, { zone: "utc" });
