import { rssResponse } from "@/lib/blog/rss";

export const revalidate = 3600;

export function GET() {
  return rssResponse("en");
}
