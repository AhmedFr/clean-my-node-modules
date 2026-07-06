import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Eyebrow } from "@/components/Eyebrow";
import { getPublishedPosts } from "@/lib/blog";
import { getDictionary, localePath, type Locale } from "@/lib/i18n";
import { formatPostDate } from "@/app/blog/format-date";

// Blog listing, parameterized by locale. Self-contained (renders its own
// Navbar + Footer) so the footer language switcher gets the right path.
export function BlogIndex({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const blog = dict.blog;
  const posts = getPublishedPosts(new Date(), locale);
  return (
    <>
      <Navbar dict={dict} locale={locale} />
      <main className="pb-[110px] pt-[72px]">
        <div className="mx-auto mb-14 max-w-[720px] px-7 text-center">
          <Eyebrow>{blog.eyebrow}</Eyebrow>
          <h1 className="mt-[14px] font-display text-[clamp(34px,5vw,54px)] font-extrabold leading-[1.02] tracking-[-0.025em]">
            {blog.listTitle}
          </h1>
          <p className="mx-auto mt-4 max-w-[560px] text-[18px] text-ink-2">
            {blog.listLead}
          </p>
        </div>
        <div className="mx-auto flex max-w-[760px] flex-col gap-[18px] px-7">
          {posts.map((post) => (
            <Link
              className="block rounded-[18px] border border-line bg-white/3 px-7 py-[26px] transition-[border-color,background,transform] duration-[180ms] hover:-translate-y-[2px] hover:border-line-2 hover:bg-white/5"
              href={localePath(locale, `/blog/${post.slug}`)}
              key={post.slug}
            >
              <time
                className="font-mono text-[12.5px] uppercase tracking-[0.06em] text-ink-3"
                dateTime={post.date}
              >
                {formatPostDate(post.date, locale)}
              </time>
              <h2 className="mt-[10px] font-display text-[24px] font-bold leading-[1.15] tracking-[-0.015em]">
                {post.title}
              </h2>
              <p className="mt-[10px] text-[15.5px] text-ink-2">
                {post.description}
              </p>
              <span className="mt-[14px] inline-block text-[14px] font-semibold text-accent">
                {blog.readArticle}
              </span>
            </Link>
          ))}
        </div>
      </main>
      <Footer dict={dict} locale={locale} path="/blog" />
    </>
  );
}
