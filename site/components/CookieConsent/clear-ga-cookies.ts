// Best-effort removal of the cookies Google Analytics sets (`_ga`, `_ga_*`,
// `_gid`). Called when a visitor withdraws consent, so declining after having
// accepted does not leave GA cookies behind. Expiring a cookie requires
// matching its domain and path, so we try the host, the dot-host, and the
// registrable domain, at path "/".
export function clearGaCookies(): void {
  if (typeof document === "undefined") return;

  const names = document.cookie
    .split(";")
    .map((c) => c.split("=")[0].trim())
    .filter((name) => name === "_ga" || name === "_gid" || name.startsWith("_ga_"));

  const host = window.location.hostname;
  const registrable = host.split(".").slice(-2).join(".");
  const domains = [undefined, host, `.${host}`, `.${registrable}`];
  const past = "Thu, 01 Jan 1970 00:00:00 GMT";

  for (const name of names) {
    for (const domain of domains) {
      const scope = domain ? `; domain=${domain}` : "";
      document.cookie = `${name}=; expires=${past}; path=/${scope}`;
    }
  }
}
