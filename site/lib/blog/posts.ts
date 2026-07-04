import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { BlogPostMeta } from "./blog.types";
import { isPublished } from "./gating";
import { markdownToHtml } from "./markdown";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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

export function getAllPosts(): BlogPostMeta[] {
  const files = fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort();
  const posts = files.map((file) => {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
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

export function getPublishedPosts(now: Date = new Date()): BlogPostMeta[] {
  return getAllPosts().filter((p) => isPublished(p.date, now));
}

export async function getPostHtml(
  slug: string,
  now: Date = new Date(),
): Promise<{ meta: BlogPostMeta; html: string } | null> {
  // Resolve via the directory listing rather than joining user input into a
  // path, so a crafted slug can never escape BLOG_DIR.
  const post = getAllPosts().find((p) => p.slug === slug);
  if (!post || !isPublished(post.date, now)) return null;
  const raw = fs.readFileSync(path.join(BLOG_DIR, `${post.slug}.md`), "utf8");
  return { meta: post, html: await markdownToHtml(matter(raw).content) };
}
