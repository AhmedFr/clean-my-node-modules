// A post goes live at midnight UTC on its frontmatter date. Pages that list
// or render posts revalidate hourly (ISR), so a scheduled post appears on its
// own within the hour, with no deploy.
export function isPublished(dateStr: string, now: Date = new Date()): boolean {
  return new Date(`${dateStr}T00:00:00Z`).getTime() <= now.getTime();
}
