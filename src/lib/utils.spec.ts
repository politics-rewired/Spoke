import { asPercentWithTotal, replaceAll, stringIsAValidUrl } from "./utils";

describe("stringIsAValidUrl", () => {
  test("recognizes valid URL", () => {
    expect(stringIsAValidUrl("https://www.politicsrewired.com")).toBe(true);
  });

  test("recognizes valid URL with query string", () => {
    expect(
      stringIsAValidUrl("https://www.politicsrewired.com?foo=bar&bar=baz")
    ).toBe(true);
  });

  test("rejects invalid URL without scheme", () => {
    expect(stringIsAValidUrl("www.politicsrewired.com")).toBe(false);
  });

  test("rejects invalid URL", () => {
    expect(stringIsAValidUrl("foo/bar")).toBe(false);
  });
});

describe("replaceAll", () => {
  test("replaces mulitple occurrences", () => {
    expect(
      replaceAll("buffalo buffalo buffalo buffalo buffalo", "buffalo", "squid")
    ).toBe("squid squid squid squid squid");
  });

  test("escapes special regex characters", () => {
    expect(replaceAll(`what about \\ characters?`, `\\`, `?`)).toBe(
      "what about ? characters?"
    );
  });
});

describe("asPercentWithTotal", () => {
  test("handles 0 denominator correctly", () => {
    expect(asPercentWithTotal(10, 0)).toBe("0%(10)");
  });

  test("truncates decimal", () => {
    expect(asPercentWithTotal(9, 11)).toBe("81.8%(9)");
  });
});
