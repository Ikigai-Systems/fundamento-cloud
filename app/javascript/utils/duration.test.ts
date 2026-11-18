import {describe, expect, it} from "vitest";
// Shared with spec/services/formula/duration_spec.rb, so the two parsers cannot drift apart.
import cases from "../../../spec/fixtures/files/duration/cases.json";
import {formatDuration, normalizeDuration, parseDuration} from "./duration";

describe("duration", () => {
  describe.each(cases.valid)("$input", ({input, seconds, canonical}) => {
    it("parses to the expected seconds", () => {
      expect(parseDuration(input)).toBe(seconds);
    });

    it("formats to the canonical text", () => {
      expect(normalizeDuration(input)).toBe(canonical);
    });
  });

  it.each(cases.invalid)("rejects %j", (input) => {
    expect(parseDuration(input)).toBeNull();
    expect(normalizeDuration(input)).toBeNull();
  });

  it("shows a negative duration with a leading minus", () => {
    expect(formatDuration(-3600 * 40)).toBe("-1 day 16 hrs");
  });

  it("rejects a total too large to hold exactly", () => {
    expect(parseDuration("999999999999999999 years")).toBeNull();
  });

  it("is stable: a canonical text normalizes to itself", () => {
    for (const {canonical} of cases.valid) {
      expect(normalizeDuration(canonical)).toBe(canonical);
    }
  });
});
