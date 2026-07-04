import { describe, expect, it } from "vitest";
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
