const { config } = require("../config");

export function getProcessEnvTz() {
  return config.TZ;
}

export function getProcessEnvDstReferenceTimezone() {
  return config.DST_REFERENCE_TIMEZONE;
}
