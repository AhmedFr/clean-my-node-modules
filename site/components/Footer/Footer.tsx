import Link from "next/link";
import { Icon } from "@/components/Icon";
import { REPO_URL } from "@/lib/links";

export function Footer() {
  return (
    <footer className="lp-footer">
      <div className="wrap">
        <div className="top">
          <div className="brandcol">
            <Link className="lp-brand" href="/#top">
              <span className="logo">
                <Icon id="logo-module" />
              </span>
              TidyDisk
            </Link>
            <p>
              The menu bar app that keeps dev junk from eating your Mac alive.
            </p>
          </div>
          <div className="fcol">
            <h5>Product</h5>
            <Link href="/#features">Features</Link>
            <Link href="/#how">How it works</Link>
            <Link href="/#download">Download</Link>
            <Link href="/blog">Blog</Link>
          </div>
          <div className="fcol">
            <h5>Open source</h5>
            <a href={REPO_URL} target="_blank" rel="noopener">
              GitHub repository
            </a>
            <a href={`${REPO_URL}/issues`} target="_blank" rel="noopener">
              Issues
            </a>
            <a href={`${REPO_URL}/releases`} target="_blank" rel="noopener">
              Releases
            </a>
          </div>
        </div>
        <div className="bottom">
          <span className="mono">© 2026 TidyDisk · MIT license</span>
          <span className="mono">macOS 13+ · Apple Silicon &amp; Intel</span>
        </div>
      </div>
    </footer>
  );
}
