import { formatDate, getClassNumber, getErrorMessage, getMostSeenClass } from "./utils";
import type { Sighting } from "./types";

const sighting = (id: string, classNumber: string): Sighting => ({
  sighting_id: id,
  tops_number: `${classNumber}001`,
  class_number: classNumber,
  location_spotted: null,
  location_destination: null,
  photo_uri: null,
  spotted_at: "2026-10-05T10:00:00.000Z",
});

describe("formatDate", () => {
  it("formats dates using UK locale and the default format", () => {
    expect(formatDate("2026-10-05T10:00:00.000Z")).toBe("5 Oct 2026");
  });

  it("accepts custom date format options", () => {
    expect(
      formatDate("2026-10-05T10:00:00.000Z", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    ).toMatch(/^Monday,? 5 October$/);
  });
});

describe("getClassNumber", () => {
  it.each([
    ["3702", "37"],
    ["37025", "37"],
    ["334002", "334"],
  ])("derives class %s from a %s digit TOPS number", (number, expected) => {
    expect(getClassNumber(number)).toBe(expected);
  });
});

describe("getMostSeenClass", () => {
  it("returns null for an empty collection", () => {
    expect(getMostSeenClass([])).toBeNull();
  });

  it("returns the only class in the collection", () => {
    expect(getMostSeenClass([sighting("one", "37")])).toBe("37");
  });

  it("returns the class with the highest sighting count", () => {
    expect(
      getMostSeenClass([
        sighting("one", "37"),
        sighting("two", "37"),
        sighting("three", "66"),
      ]),
    ).toBe("37");
  });

  it("resolves tied classes by first-seen insertion order", () => {
    expect(getMostSeenClass([sighting("one", "37"), sighting("two", "66")])).toBe(
      "37",
    );
  });
});

describe("getErrorMessage", () => {
  it("returns an Error message", () => {
    expect(getErrorMessage(new Error("database failed"))).toBe("database failed");
  });

  it("converts non-Error values to strings", () => {
    expect(getErrorMessage("permission denied")).toBe("permission denied");
    expect(getErrorMessage({ reason: "offline" })).toBe("[object Object]");
  });
});
