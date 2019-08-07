export function getProcessEnvTz() {
  return typeof window === "undefined" ? process.env.TZ : window.TZ;
}

export function getProcessEnvDstReferenceTimezone() {
  return typeof window === "undefined"
    ? process.env.DST_REFERENCE_TIMEZONE
    : window.DST_REFERENCE_TIMEZONE;
}
