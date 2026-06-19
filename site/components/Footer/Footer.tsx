import { Icon } from "@/components/Icon";
import { REPO_URL } from "@/lib/links";

export function Footer() {
  return (
    <footer className="lp-footer">
      <div className="wrap">
        <div className="top">
          <div className="brandcol">
            <a className="lp-brand" href="#top">
              <span className="logo">
                <Icon id="logo-module" />
              </span>
              Clean my node_modules
            </a>
            <p>
              The open-source menu bar app that keeps node_modules from eating
              your Mac alive.
            </p>
          </div>
          <div className="fcol">
            <h5>Product</h5>
            <a href="#features">Features</a>
            <a href="#why">Why</a>
            <a href="#how">How it works</a>
            <a href="#download">Download</a>
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
          <span className="mono">
            © 2026 Clean my node_modules · MIT license
          </span>
          <span className="mono">macOS 13+ · Apple Silicon &amp; Intel</span>
        </div>
      </div>
    </footer>
  );
}
