import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedPosts } from "@/lib/blog";
import { formatPostDate } from "./format-date";

// Posts are date-gated; hourly revalidation lets scheduled posts appear on
// their own, with no deploy.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "TidyDisk blog: keeping dev disks clean",
  description:
    "Practical guides on node_modules cleanup, package manager disk usage, and reclaiming space on a developer Mac. From the makers of TidyDisk.",
  alternates: {
    canonical: "/blog",
    types: { "application/rss+xml": "/blog/rss.xml" },
  },
};

export default function BlogIndex() {
  const posts = getPublishedPosts();
  return (
    <>
      <div className="blog-head">
        <span className="lp-eyebrow">
          <span className="dot" />
          blog
        </span>
        <h1>
          Keeping dev disks <span className="accent">clean</span>
        </h1>
        <p>
          Practical guides on node_modules, package manager internals, and
          getting your disk space back. New article every week.
        </p>
      </div>
      <div className="blog-list">
        {posts.map((post) => (
          <Link className="blog-card" href={`/blog/${post.slug}`} key={post.slug}>
            <time dateTime={post.date}>{formatPostDate(post.date)}</time>
            <h2>{post.title}</h2>
            <p>{post.description}</p>
            <span className="more">Read article</span>
          </Link>
        ))}
      </div>
    </>
  );
}
