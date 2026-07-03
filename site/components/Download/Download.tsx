import { Icon } from "@/components/Icon";
import { REPO_URL, DOWNLOAD_URL } from "@/lib/links";

function Check() {
  return (
    <span className="ck">
      <Icon id="i-check" />
    </span>
  );
}

export function Download() {
  return (
    <section className="lp-price-sec" id="download">
      <div className="wrap">
        <div className="lp-section-head reveal">
          <div className="lp-kicker">Download</div>
          <h2 className="lp-h2">
            Free &amp; <span className="accent">open source.</span>
          </h2>
          <p className="lp-lead">
            The whole app is open source under MIT. Every feature, no gates.
            Grab the signed &amp; notarized build, or build it yourself from
            source. No accounts, no subscription.
          </p>
        </div>
        <div className="lp-prices">
          <div className="lp-price reveal">
            <div className="pname">Build from source</div>
            <div className="pdesc">The entire app, MIT-licensed on GitHub.</div>
            <div className="pcost">
              <span className="amt">$0</span>
              <span className="per">build it yourself</span>
            </div>
            <ul>
              <li>
                <Check />
                Every feature, nothing held back
              </li>
              <li>
                <Check />
                Clone, <code>pnpm install</code>, <code>pnpm package</code>
              </li>
              <li>
                <Check />
                Read it, fork it, send a PR
              </li>
            </ul>
            <a
              className="lp-btn lp-btn-ghost"
              href={REPO_URL}
              target="_blank"
              rel="noopener"
            >
              <Icon id="i-github" />
              View on GitHub
            </a>
          </div>
          <div className="lp-price feat reveal d1">
            <span className="pbadge">Recommended</span>
            <div className="pname">Download</div>
            <div className="pdesc">
              The signed &amp; notarized .app, ready to run.
            </div>
            <div className="pcost">
              <span className="amt">$0</span>
              <span className="per">free download</span>
            </div>
            <ul>
              <li>
                <Check />
                Signed &amp; notarized .app, no Gatekeeper hoops
              </li>
              <li>
                <Check />
                Download and run in seconds, no toolchain
              </li>
              <li>
                <Check />
                macOS 13+ · Apple Silicon &amp; Intel
              </li>
            </ul>
            <a className="lp-btn lp-btn-primary" href={DOWNLOAD_URL}>
              <Icon id="i-download" />
              Download for macOS
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
