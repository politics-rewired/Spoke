import isClient from "./is-client";

export function getProcessEnvTz() {
  return isClient() ? window.TZ : process.env.TZ;
}

export function getProcessEnvDstReferenceTimezone() {
  return isClient()
    ? window.DST_REFERENCE_TIMEZONE
    : process.env.DST_REFERENCE_TIMEZONE;
}
