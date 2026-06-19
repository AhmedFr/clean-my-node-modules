import { Icon } from "@/components/Icon";
import { AppPanel } from "@/components/AppPanel";
import { REPO_URL, DOWNLOAD_URL } from "@/lib/links";

export function Hero() {
  return (
    <section className="lp-hero">
      <div className="wrap">
        <div className="lp-eyebrow reveal">
          <span className="dot" />
          Open source · macOS menu bar app
        </div>
        <h1 className="lp-h1 reveal d1">
          Get your disk back from <span className="accent">node_modules</span>.
        </h1>
        <p className="lp-sub reveal d2">
          Clean my node_modules lives in your menu bar, tracks every{" "}
          <code>node_modules</code> folder on your Mac against the GB limit you
          set, and reclaims the stale ones safely — straight to the Trash, never{" "}
          <code>rm -rf</code>.
        </p>
        <div className="lp-cta-row reveal d2">
          <a className="lp-btn lp-btn-primary lp-btn-lg" href={DOWNLOAD_URL}>
            <Icon id="i-download" />
            Download for macOS
          </a>
          <a
            className="lp-btn lp-btn-ghost lp-btn-lg"
            href={REPO_URL}
            target="_blank"
            rel="noopener"
          >
            <Icon id="i-github" />
            View on GitHub
          </a>
        </div>
        <div className="lp-micro reveal d3">
          MIT-licensed · macOS 13+ · Apple Silicon &amp; Intel
        </div>
      </div>

      <div className="lp-scene-wrap reveal d2">
        <div className="lp-scene-glow" />
        <div className="lp-screen">
          {/* menu bar */}
          <div className="scene-bar">
            <div className="left">
              <span className="b" />
              <span className="m">Finder</span>
              <span className="m">File</span>
              <span className="m">Edit</span>
              <span className="m">View</span>
            </div>
            <div className="right">
              <span className="tray">
                <Icon id="logo-module" />
                <span className="od" />
              </span>
              <svg className="sys" viewBox="0 0 24 20">
                <use href="#i-sun" />
              </svg>
              <svg className="sys" viewBox="0 0 24 20" style={{ width: 22 }}>
                <use href="#i-battery" />
              </svg>
              <span className="clock">Mon&nbsp;9:41</span>
            </div>
          </div>

          {/* dropdown — recreation of the real menu-bar panel */}
          <div className="scene-dropdown glass-panel">
            <AppPanel />
          </div>

          {/* floating toast */}
          <div className="scene-toast">
            <svg className="ic" viewBox="0 0 24 24">
              <use href="#i-checkcircle" />
            </svg>
            <span>
              <b>Reclaimed 612 MB</b> &nbsp;
              <span className="s">legacy-dashboard</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
