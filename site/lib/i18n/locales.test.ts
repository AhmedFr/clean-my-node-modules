import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  EXTRA_LOCALES,
  LOCALES,
  LOCALE_NAMES,
  isLocale,
  localePath,
} from "./locales";

describe("locale primitives", () => {
  it("lists the five supported locales with en first", () => {
    expect(LOCALES).toEqual(["en", "fr", "es", "de", "pt"]);
    expect(DEFAULT_LOCALE).toBe("en");
    expect(EXTRA_LOCALES).toEqual(["fr", "es", "de", "pt"]);
  });

  it("names every locale", () => {
    expect(LOCALE_NAMES).toEqual({
      en: "English",
      fr: "Français",
      es: "Español",
      de: "Deutsch",
      pt: "Português",
    });
  });
});

describe("isLocale", () => {
  it("accepts supported locales", () => {
    for (const l of LOCALES) expect(isLocale(l)).toBe(true);
  });
  it("rejects anything else", () => {
    expect(isLocale("EN")).toBe(false);
    expect(isLocale("it")).toBe(false);
    expect(isLocale("")).toBe(false);
    expect(isLocale("blog")).toBe(false);
  });
});

describe("localePath", () => {
  it("leaves English paths unprefixed", () => {
    expect(localePath("en", "/")).toBe("/");
    expect(localePath("en", "/blog")).toBe("/blog");
    expect(localePath("en", "/blog/x")).toBe("/blog/x");
    expect(localePath("en", "/#features")).toBe("/#features");
  });

  it("prefixes the segment for other locales", () => {
    expect(localePath("fr", "/")).toBe("/fr");
    expect(localePath("fr", "/blog")).toBe("/fr/blog");
    expect(localePath("fr", "/blog/x")).toBe("/fr/blog/x");
    expect(localePath("fr", "/#features")).toBe("/fr/#features");
  });
});
