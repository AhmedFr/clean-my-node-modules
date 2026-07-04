import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostHtml, getPublishedPosts } from "@/lib/blog";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL } from "@/lib/site-url";
import { DOWNLOAD_URL } from "@/lib/links";
import { Icon } from "@/components/Icon";
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
    <article className="blog-article">
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
      <header className="blog-article-head">
        <a className="blog-back" href="/blog">
          ← All articles
        </a>
        <h1>{post.meta.title}</h1>
        <div className="blog-byline">
          <span>TidyDisk team</span>
          <span className="dot" />
          <time dateTime={post.meta.date}>{formatPostDate(post.meta.date)}</time>
        </div>
      </header>
      <div
        className="blog-prose"
        dangerouslySetInnerHTML={{ __html: post.html }}
      />
      <aside className="blog-cta">
        <h2>See what your projects really cost</h2>
        <p>
          TidyDisk scans your Mac for free and shows every node_modules folder,
          sized and ranked. Cleanup is one click, always to the Trash.
        </p>
        <a className="lp-btn lp-btn-primary" href={DOWNLOAD_URL} target="_blank" rel="noopener">
          <Icon id="i-download" />
          Download for macOS
        </a>
      </aside>
    </article>
  );
}
