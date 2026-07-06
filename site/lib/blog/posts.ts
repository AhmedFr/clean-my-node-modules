import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Locale } from "@/lib/i18n/locales";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";
import type { BlogPostMeta } from "./blog.types";
import { isPublished } from "./gating";
import { markdownToHtml } from "./markdown";

const BLOG_ROOT = path.join(process.cwd(), "content", "blog");
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Articles live under content/blog/<locale>/; slugs and dates are identical
// across locales (see the parity test), which keeps the hreflang map trivial.
function localeDir(locale: Locale): string {
  return path.join(BLOG_ROOT, locale);
}

function parseMeta(file: string, data: Record<string, unknown>): BlogPostMeta {
  const { title, description, date } = data;
  if (typeof title !== "string" || title.trim() === "") {
    throw new Error(`Invalid frontmatter in ${file}: missing title`);
  }
  if (typeof description !== "string" || description.trim() === "") {
    throw new Error(`Invalid frontmatter in ${file}: missing description`);
  }
  if (typeof date !== "string" || !DATE_RE.test(date)) {
    throw new Error(
      `Invalid frontmatter in ${file}: date must be a YYYY-MM-DD string`,
    );
  }
  return { slug: file.replace(/\.md$/, ""), title, description, date };
}

export function getAllPosts(locale: Locale = DEFAULT_LOCALE): BlogPostMeta[] {
  const dir = localeDir(locale);
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort();
  const posts = files.map((file) => {
    const raw = fs.readFileSync(path.join(dir, file), "utf8");
    return parseMeta(file, matter(raw).data);
  });
  const slugs = new Set(posts.map((p) => p.slug));
  if (slugs.size !== posts.length) {
    throw new Error("Duplicate blog slugs detected");
  }
  // Newest first; slug tie-break keeps the order deterministic.
  return posts.sort(
    (a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug),
  );
}

export function getPublishedPosts(
  now: Date = new Date(),
  locale: Locale = DEFAULT_LOCALE,
): BlogPostMeta[] {
  return getAllPosts(locale).filter((p) => isPublished(p.date, now));
}

export async function getPostHtml(
  slug: string,
  now: Date = new Date(),
  locale: Locale = DEFAULT_LOCALE,
): Promise<{ meta: BlogPostMeta; html: string } | null> {
  // Resolve via the directory listing rather than joining user input into a
  // path, so a crafted slug can never escape the locale's blog dir.
  const post = getAllPosts(locale).find((p) => p.slug === slug);
  if (!post || !isPublished(post.date, now)) return null;
  const raw = fs.readFileSync(
    path.join(localeDir(locale), `${post.slug}.md`),
    "utf8",
  );
  return { meta: post, html: await markdownToHtml(matter(raw).content) };
}
