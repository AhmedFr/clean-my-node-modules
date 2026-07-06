import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { Icon } from "@/components/Icon";
import { Btn } from "@/components/Btn";
import { getPostHtml } from "@/lib/blog";
import { SITE_URL } from "@/lib/site-url";
import { DOWNLOAD_URL } from "@/lib/links";
import { getDictionary, localePath, type Locale } from "@/lib/i18n";
import { formatPostDate } from "@/app/blog/format-date";

// A single article, parameterized by locale + slug. Self-contained.
export async function BlogArticle({
  locale,
  slug,
}: {
  locale: Locale;
  slug: string;
}) {
  const dict = getDictionary(locale);
  const blog = dict.blog;
  const post = await getPostHtml(slug, new Date(), locale);
  if (!post) notFound();

  return (
    <>
      <Navbar dict={dict} locale={locale} />
      <main className="pb-[110px] pt-[72px]">
        <article className="mx-auto max-w-[720px] px-7">
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              headline: post.meta.title,
              description: post.meta.description,
              datePublished: `${post.meta.date}T00:00:00Z`,
              inLanguage: locale,
              author: { "@type": "Organization", name: "TidyDisk team" },
              publisher: {
                "@type": "Organization",
                name: "TidyDisk",
                url: SITE_URL,
              },
              mainEntityOfPage: `${SITE_URL}${localePath(locale, `/blog/${post.meta.slug}`)}`,
            }}
          />
          <header className="mb-10">
            <Link
              className="font-mono text-[13px] text-ink-3 transition-colors duration-150 hover:text-accent"
              href={localePath(locale, "/blog")}
            >
              {blog.backToArticles}
            </Link>
            <h1 className="mt-[18px] font-display text-[clamp(30px,4.6vw,44px)] font-extrabold leading-[1.06] tracking-[-0.02em]">
              {post.meta.title}
            </h1>
            <div className="mt-[18px] flex items-center gap-[10px] font-mono text-[13px] text-ink-3">
              <span>{blog.byline}</span>
              <span className="h-1 w-1 rounded-full bg-ink-4" />
              <time dateTime={post.meta.date}>
                {formatPostDate(post.meta.date)}
              </time>
            </div>
          </header>
          <div
            className="blog-prose"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />
          <aside className="mt-14 rounded-[20px] border border-[rgba(255,99,99,0.22)] bg-[linear-gradient(180deg,rgba(255,99,99,0.09),rgba(255,99,99,0.03))] p-8 text-center">
            <h2 className="font-display text-[24px] font-extrabold tracking-[-0.015em]">
              {blog.ctaTitle}
            </h2>
            <p className="mx-auto mb-5 mt-[10px] max-w-[46ch] text-[15.5px] text-ink-2">
              {blog.ctaBody}
            </p>
            <Btn variant="primary" href={DOWNLOAD_URL} target="_blank" rel="noopener">
              <Icon id="i-download" />
              {blog.ctaButton}
            </Btn>
          </aside>
        </article>
      </main>
      <Footer dict={dict} locale={locale} path={`/blog/${post.meta.slug}`} />
    </>
  );
}
