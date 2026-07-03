import { Icon } from "@/components/Icon";
import { DOWNLOAD_URL, BUY_URL } from "@/lib/links";

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
            Free to scan. <span className="accent">19 euros to clean.</span>
          </h2>
          <p className="lp-lead">
            The scan is free forever and the source is MIT on GitHub.
            One-click cleanup is a one-time lifetime license: founding price
            19 euros, then 29 after launch. 30-day money-back, no questions.
          </p>
        </div>
        <div className="lp-prices">
          <div className="lp-price reveal">
            <div className="pname">
              <span className="accent">$0</span> · Scan everything
            </div>
            <div className="pdesc">The scan, free forever.</div>
            <ul>
              <li>
                <Check />
                Download and run, no setup required
              </li>
              <li>
                <Check />
                See every node_modules folder, cache, and package on your
                machine
              </li>
              <li>
                <Check />
                No account, ever
              </li>
            </ul>
            <a className="lp-btn lp-btn-ghost" href={DOWNLOAD_URL}>
              <Icon id="i-download" />
              Download for macOS
            </a>
          </div>
          <div className="lp-price feat reveal d1">
            <span className="pbadge">Founding price</span>
            <div className="pname">
              <span className="accent">€19</span> · Lifetime cleanup
            </div>
            <div className="pdesc">One-time license, unlocks cleanup for life.</div>
            <ul>
              <li>
                <Check />
                One-click delete, straight to the Trash
              </li>
              <li>
                <Check />
                Clean stale: sweep every stale node_modules at once
              </li>
              <li>
                <Check />
                Prune your pnpm store, one click
              </li>
              <li>
                <Check />
                All future updates included
              </li>
              <li>
                <Check />
                Instant license key, delivered via Polar
              </li>
              <li>
                <Check />
                Founding price: 19 euros now, 29 euros after launch
              </li>
            </ul>
            <a className="lp-btn lp-btn-primary" href={BUY_URL}>
              <Icon id="i-broom" />
              Buy TidyDisk · €19
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
