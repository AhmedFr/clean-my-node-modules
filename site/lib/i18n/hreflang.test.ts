import { describe, expect, it } from "vitest";
import { SITE_URL } from "@/lib/site-url";
import { languageAlternates } from "./hreflang";

describe("languageAlternates", () => {
  it("maps every locale plus x-default for a blog path", () => {
    const alt = languageAlternates("/blog");
    expect(Object.keys(alt).sort()).toEqual(
      ["de", "en", "es", "fr", "pt", "x-default"].sort(),
    );
    expect(alt.en).toBe(`${SITE_URL}/blog`);
    expect(alt.fr).toBe(`${SITE_URL}/fr/blog`);
    expect(alt.es).toBe(`${SITE_URL}/es/blog`);
    expect(alt.de).toBe(`${SITE_URL}/de/blog`);
    expect(alt.pt).toBe(`${SITE_URL}/pt/blog`);
    expect(alt["x-default"]).toBe(`${SITE_URL}/blog`);
  });

  it("keeps the home path clean for en and x-default", () => {
    const alt = languageAlternates("/");
    expect(alt.en).toBe(`${SITE_URL}/`);
    expect(alt.fr).toBe(`${SITE_URL}/fr`);
    expect(alt["x-default"]).toBe(`${SITE_URL}/`);
  });
});
