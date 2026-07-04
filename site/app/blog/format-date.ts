// Publish dates are date-only (midnight UTC); format in UTC so the shown
// day never shifts with the server timezone.
export function formatPostDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
