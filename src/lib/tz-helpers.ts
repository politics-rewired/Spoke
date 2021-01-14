import { DateTime } from "./datetime";

export const getProcessEnvTz: () => string = () =>
  typeof window === "undefined" ? (process.env.TZ as string) : window.TZ;

export const getProcessEnvDstReferenceTimezone: () => string = () =>
  typeof window === "undefined"
    ? (process.env.DST_REFERENCE_TIMEZONE as string)
    : window.DST_REFERENCE_TIMEZONE;

export const isValidTimezone: (tzstr: string) => boolean = (tzstr) =>
  DateTime.local().setZone(tzstr).invalidReason !== "unsupported zone";

export const asUtc: (dt: Date) => DateTime = (dt) =>
  DateTime.fromJSDate(dt, { zone: "utc" });
