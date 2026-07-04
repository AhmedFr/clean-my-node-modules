import { describe, expect, it } from "vitest";
import { isPublished } from "./gating";

describe("isPublished", () => {
  const now = new Date("2026-07-04T10:00:00Z");

  it("past date is published", () => {
    expect(isPublished("2026-06-27", now)).toBe(true);
  });

  it("today is published", () => {
    expect(isPublished("2026-07-04", now)).toBe(true);
  });

  it("future date is hidden", () => {
    expect(isPublished("2026-07-11", now)).toBe(false);
  });

  it("publishes exactly at midnight UTC", () => {
    expect(isPublished("2026-07-04", new Date("2026-07-04T00:00:00Z"))).toBe(
      true,
    );
    expect(isPublished("2026-07-04", new Date("2026-07-03T23:59:59Z"))).toBe(
      false,
    );
  });
});
