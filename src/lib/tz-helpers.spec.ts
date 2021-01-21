import { DateTime } from "./datetime";
import { getSendBeforeUtc } from "./tz-helpers";

describe("getSendBefore", () => {
  test("gets correct sendBefore for midday Eastern", () => {
    const middayUsEastern = DateTime.fromISO("2020-01-20T12:00:00-05:00");
    expect(getSendBeforeUtc("America/New_York", 21, middayUsEastern)).toBe(
      "2020-01-21T02:00:00.000Z"
    );
  });

  test("gets correct sendBefore for afterhours Eastern", () => {
    const afterHoursEastern = DateTime.fromISO("2020-01-20T22:00:00-05:00");
    expect(getSendBeforeUtc("America/New_York", 21, afterHoursEastern)).toBe(
      "2020-01-21T02:00:00.000Z"
    );
  });

  test("gets correct sendBefore for afterhours UTC", () => {
    const afterHoursUtc = DateTime.fromISO("2020-01-21T03:00:00Z");
    expect(getSendBeforeUtc("America/New_York", 21, afterHoursUtc)).toBe(
      "2020-01-21T02:00:00.000Z"
    );
  });
});
