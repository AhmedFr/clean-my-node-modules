export type BlogPostMeta = {
  /** Filename minus .md; the URL segment under /blog/. */
  slug: string;
  title: string;
  description: string;
  /** Publish date as YYYY-MM-DD; the post is live from midnight UTC. */
  date: string;
};
