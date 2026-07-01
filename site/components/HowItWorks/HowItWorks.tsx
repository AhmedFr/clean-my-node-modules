export function HowItWorks() {
  return (
    <section className="lp-steps-sec" id="how">
      <div className="wrap">
        <div className="lp-section-head reveal">
          <div className="lp-kicker">How it works</div>
          <h2 className="lp-h2">
            Three steps to a <span className="accent">lighter Mac.</span>
          </h2>
        </div>
        <div className="lp-steps">
          <div className="lp-step reveal">
            <div className="num">01</div>
            <h4>Get it &amp; it scans</h4>
            <p>
              Download the signed .app — or clone the repo and build your own.
              The first scan maps every node_modules folder on your disk.
            </p>
            <div className="cmd">
              <span className="pmt">$</span>pnpm install &amp;&amp; pnpm package
            </div>
          </div>
          <div className="lp-step reveal d1">
            <div className="num">02</div>
            <h4>Set your limit</h4>
            <p>
              Pick a threshold in gigabytes and how often to rescan — every 6
              hours, daily, or weekly. That&apos;s the entire setup.
            </p>
            <div className="cmd">
              <span className="pmt">limit</span> 5 GB ·{" "}
              <span className="pmt">scan</span> daily
            </div>
          </div>
          <div className="lp-step reveal d2">
            <div className="num">03</div>
            <h4>Clean in a click</h4>
            <p>
              When you cross the line, review the stale folders — or prune the
              pnpm store, or audit a heavy package — and reclaim the space. Your
              disk thanks you.
            </p>
            <div className="cmd">
              <span className="pmt">↵</span> 2.71 GB moved to Trash
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
