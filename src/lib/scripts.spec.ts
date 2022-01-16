import { titleCase } from "./scripts";

describe("script utilities", () => {
  it("converts uppercase single word to title case", () => {
    expect(titleCase("SPOKE")).toEqual("Spoke");
  });
  it("converts lowercase single word to title case", () => {
    expect(titleCase("spoke")).toEqual("Spoke");
  });
  it("converts mixed-case single word to title case", () => {
    expect(titleCase("sPoKe")).toEqual("Spoke");
  });

  it("converts uppercase words to title case", () => {
    expect(titleCase("SPOKE REWIRED")).toEqual("Spoke Rewired");
  });
  it("converts lowercase single word to title case", () => {
    expect(titleCase("spoke rewired")).toEqual("Spoke Rewired");
  });
  it("converts mixed-case single word to title case", () => {
    expect(titleCase("sPoKe ReWirEd")).toEqual("Spoke Rewired");
  });
  it("ignores hyphens", () => {
    expect(titleCase("spoke-rewired")).toEqual("Spoke-rewired");
  });
});
