import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/Eyebrow";
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
      <div className="mx-auto mb-14 max-w-[720px] px-7 text-center">
        <Eyebrow>blog</Eyebrow>
        <h1 className="mt-[14px] font-display text-[clamp(34px,5vw,54px)] font-extrabold leading-[1.02] tracking-[-0.025em]">
          Keeping dev disks <span className="text-accent">clean</span>
        </h1>
        <p className="mx-auto mt-4 max-w-[560px] text-[18px] text-ink-2">
          Practical guides on node_modules, package manager internals, and
          getting your disk space back. New article every week.
        </p>
      </div>
      <div className="mx-auto flex max-w-[760px] flex-col gap-[18px] px-7">
        {posts.map((post) => (
          <Link
            className="block rounded-[18px] border border-line bg-white/3 px-7 py-[26px] transition-[border-color,background,transform] duration-[180ms] hover:-translate-y-[2px] hover:border-line-2 hover:bg-white/5"
            href={`/blog/${post.slug}`}
            key={post.slug}
          >
            <time
              className="font-mono text-[12.5px] uppercase tracking-[0.06em] text-ink-3"
              dateTime={post.date}
            >
              {formatPostDate(post.date)}
            </time>
            <h2 className="mt-[10px] font-display text-[24px] font-bold leading-[1.15] tracking-[-0.015em]">
              {post.title}
            </h2>
            <p className="mt-[10px] text-[15.5px] text-ink-2">
              {post.description}
            </p>
            <span className="mt-[14px] inline-block text-[14px] font-semibold text-accent">
              Read article
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
