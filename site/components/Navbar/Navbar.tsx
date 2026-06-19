import { Icon } from "@/components/Icon";
import { REPO_URL, DOWNLOAD_URL } from "@/lib/links";

export function Navbar() {
  return (
    <header className="lp-nav">
      <a className="lp-brand" href="#top">
        <span className="logo">
          <Icon id="logo-module" />
        </span>
        Clean my node_modules
      </a>
      <nav className="lp-navlinks">
        <a href="#features">Features</a>
        <a href="#why">Why</a>
        <a href="#how">How it works</a>
        <a href="#download">Download</a>
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
        <a className="lp-btn lp-btn-primary lp-btn-sm" href={DOWNLOAD_URL}>
          <Icon id="i-download" />
          Get the app
        </a>
      </div>
    </header>
  );
}
