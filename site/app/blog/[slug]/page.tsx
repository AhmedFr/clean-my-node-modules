import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostHtml, getPublishedPosts } from "@/lib/blog";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL } from "@/lib/site-url";
import { DOWNLOAD_URL } from "@/lib/links";
import { Icon } from "@/components/Icon";
import { Btn } from "@/components/Btn";
import { formatPostDate } from "../format-date";

export const revalidate = 3600;
// Future-dated posts are not pre-rendered; once their date passes they are
// rendered on demand instead of 404ing.
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getPublishedPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostHtml((await params).slug);
  if (!post) return {};
  const url = `/blog/${post.meta.slug}`;
  return {
    title: `${post.meta.title} | TidyDisk blog`,
    description: post.meta.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      siteName: "TidyDisk",
      title: post.meta.title,
      description: post.meta.description,
      publishedTime: `${post.meta.date}T00:00:00Z`,
    },
    twitter: {
      card: "summary_large_image",
      title: post.meta.title,
      description: post.meta.description,
    },
  };
}

export default async function BlogPost({ params }: Props) {
  const post = await getPostHtml((await params).slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-[720px] px-7">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.meta.title,
          description: post.meta.description,
          datePublished: `${post.meta.date}T00:00:00Z`,
          author: { "@type": "Organization", name: "TidyDisk team" },
          publisher: { "@type": "Organization", name: "TidyDisk", url: SITE_URL },
          mainEntityOfPage: `${SITE_URL}/blog/${post.meta.slug}`,
        }}
      />
      <header className="mb-10">
        <Link
          className="font-mono text-[13px] text-ink-3 transition-colors duration-150 hover:text-accent"
          href="/blog"
        >
          ← All articles
        </Link>
        <h1 className="mt-[18px] font-display text-[clamp(30px,4.6vw,44px)] font-extrabold leading-[1.06] tracking-[-0.02em]">
          {post.meta.title}
        </h1>
        <div className="mt-[18px] flex items-center gap-[10px] font-mono text-[13px] text-ink-3">
          <span>TidyDisk team</span>
          <span className="h-1 w-1 rounded-full bg-ink-4" />
          <time dateTime={post.meta.date}>{formatPostDate(post.meta.date)}</time>
        </div>
      </header>
      <div
        className="blog-prose"
        dangerouslySetInnerHTML={{ __html: post.html }}
      />
      <aside className="mt-14 rounded-[20px] border border-[rgba(255,99,99,0.22)] bg-[linear-gradient(180deg,rgba(255,99,99,0.09),rgba(255,99,99,0.03))] p-8 text-center">
        <h2 className="font-display text-[24px] font-extrabold tracking-[-0.015em]">
          See what your projects really cost
        </h2>
        <p className="mx-auto mb-5 mt-[10px] max-w-[46ch] text-[15.5px] text-ink-2">
          TidyDisk scans your Mac for free and shows every node_modules folder,
          sized and ranked. Cleanup is one click, always to the Trash.
        </p>
        <Btn variant="primary" href={DOWNLOAD_URL} target="_blank" rel="noopener">
          <Icon id="i-download" />
          Download for macOS
        </Btn>
      </aside>
    </article>
  );
}
