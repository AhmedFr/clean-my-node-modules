import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { Locale } from "@/lib/i18n/locales";
import { isLocale } from "@/lib/i18n/locales";
import { getAllPosts, getPublishedPosts, getPostHtml } from "./posts";

describe("getAllPosts", () => {
  it("loads posts with valid frontmatter", () => {
    const posts = getAllPosts();
    expect(posts.length).toBeGreaterThanOrEqual(2);
    for (const p of posts) {
      expect(p.title.length).toBeGreaterThan(0);
      expect(p.description.length).toBeGreaterThan(0);
      expect(p.description.length).toBeLessThanOrEqual(160);
      expect(p.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(p.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("sorts newest first", () => {
    const dates = getAllPosts().map((p) => p.date);
    expect(dates).toEqual([...dates].sort().reverse());
  });
});

describe("getPublishedPosts", () => {
  it("excludes future-dated posts", () => {
    const now = new Date("2026-07-05T00:00:00Z");
    const published = getPublishedPosts(now);
    expect(published.map((p) => p.slug)).toContain(
      "how-to-delete-node-modules-safely",
    );
    expect(published.map((p) => p.slug)).not.toContain(
      "why-is-node-modules-so-huge",
    );
  });
});

describe("getPostHtml", () => {
  it("renders a published post to html", async () => {
    const now = new Date("2026-07-05T00:00:00Z");
    const post = await getPostHtml("how-to-delete-node-modules-safely", now);
    expect(post).not.toBeNull();
    expect(post!.html).toContain("<h2");
    expect(post!.meta.date).toBe("2026-07-04");
  });

  it("returns null for unknown slugs", async () => {
    expect(await getPostHtml("nope")).toBeNull();
  });

  it("returns null for future-dated posts", async () => {
    const now = new Date("2026-07-05T00:00:00Z");
    expect(await getPostHtml("why-is-node-modules-so-huge", now)).toBeNull();
  });
});

describe("locale parity", () => {
  // Every locale directory must expose exactly the same {slug, date} set as
  // English. Today only en/ exists so this trivially passes; once fr/es/de/pt
  // land, a missing, extra, or wrong-dated translation fails the build.
  const blogRoot = path.join(process.cwd(), "content", "blog");
  const localeDirs = fs
    .readdirSync(blogRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory() && isLocale(d.name))
    .map((d) => d.name as Locale);

  const key = (locale: Locale) =>
    getAllPosts(locale)
      .map((p) => `${p.slug}@${p.date}`)
      .sort();

  it("includes English", () => {
    expect(localeDirs).toContain("en");
  });

  const enKeys = key("en");

  for (const locale of localeDirs) {
    it(`${locale} has the same slugs and dates as en`, () => {
      expect(key(locale)).toEqual(enKeys);
    });
  }
});
