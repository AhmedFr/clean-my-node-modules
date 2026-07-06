import Link from "next/link";
import { Icon } from "@/components/Icon";
import { REPO_URL, DOWNLOAD_URL } from "@/lib/links";

export function Navbar() {
  return (
    <header className="lp-nav">
      <Link className="lp-brand" href="/#top">
        <span className="logo">
          <Icon id="logo-module" />
        </span>
        TidyDisk
      </Link>
      <nav className="lp-navlinks">
        <Link href="/#features">Features</Link>
        <Link href="/#packages">Packages</Link>
        <Link href="/#why">Why</Link>
        <Link href="/#how">How it works</Link>
        <Link href="/#download">Download</Link>
        <Link href="/blog">Blog</Link>
      </nav>
      <div className="lp-nav-right">
        <a
          className="lp-btn lp-btn-ghost lp-btn-sm"
          href={REPO_URL}
          target="_blank"
          rel="noopener"
        >
          <Icon id="i-github" />
          GitHub
        </a>
        <a className="lp-btn lp-btn-primary lp-btn-sm" href={DOWNLOAD_URL} target="_blank" rel="noopener">
          <Icon id="i-download" />
          Get the app
        </a>
      </div>
    </header>
  );
}
