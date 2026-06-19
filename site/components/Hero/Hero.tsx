import { Icon } from "@/components/Icon";
import { PixelMeter } from "@/components/PixelMeter";
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

          {/* dropdown */}
          <div className="scene-dropdown glass-panel">
            <div className="ui-pad">
              <div className="ui-eyebrow">node_modules on disk</div>
              <div className="ui-total">
                <span className="big">5.42 GB</span>
                <span className="ui-status over">
                  <Icon id="i-alert" />
                  430 MB over your 5 GB limit
                </span>
              </div>
              <PixelMeter
                used={5.42}
                threshold={5}
                cells={32}
                style={{ marginTop: 13 }}
              />
            </div>
            <div className="ui-sep" />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 15px 4px",
              }}
            >
              <span className="ui-eyebrow">Reclaimable · oldest first</span>
              <span style={{ fontSize: 11, color: "var(--ink-4)" }}>
                12 total
              </span>
            </div>
            <div className="ui-rows" style={{ padding: "0 0 2px" }}>
              <div className="ui-row">
                <svg className="fw" viewBox="0 0 24 24">
                  <use href="#fw-react" />
                </svg>
                <div className="meta">
                  <div className="nm">legacy-dashboard</div>
                  <div className="sub">1 year ago</div>
                </div>
                <div className="sz">
                  612<span className="u">MB</span>
                </div>
              </div>
              <div className="ui-row">
                <svg className="fw" viewBox="0 0 24 24">
                  <use href="#fw-expo" />
                </svg>
                <div className="meta">
                  <div className="nm">recipe-app-old</div>
                  <div className="sub">7 months ago</div>
                </div>
                <div className="sz">
                  903<span className="u">MB</span>
                </div>
              </div>
              <div className="ui-row">
                <svg className="fw" viewBox="0 0 24 24">
                  <use href="#fw-node" />
                </svg>
                <div className="meta">
                  <div className="nm">hackathon-bot</div>
                  <div className="sub">9 months ago</div>
                </div>
                <div className="sz">
                  441<span className="u">MB</span>
                </div>
              </div>
            </div>
            <div className="ui-cta">
              <span className="t">Clean 5 stale folders</span>
              <span className="s">Frees 2.2 GB · keeps your active projects</span>
            </div>
            <div className="ui-sep" />
            <div style={{ padding: "5px 0" }}>
              <div className="ui-mitem">
                <Icon id="i-search" />
                Open full window…<span className="sc">⌘O</span>
              </div>
              <div className="ui-mitem">
                <Icon id="i-refresh" />
                Scan now<span className="sc">⌘R</span>
              </div>
              <div className="ui-mitem">
                <Icon id="i-gear" />
                Settings…<span className="sc">⌘,</span>
              </div>
            </div>
            <div className="ui-sep" />
            <div className="ui-foot-note">Last scan 6 min ago · next in 18 h</div>
          </div>

          {/* floating toast */}
          <div className="scene-toast">
            <svg className="ic" viewBox="0 0 24 24">
              <use href="#i-checkcircle" />
            </svg>
            <span>
              <b>612 MB moved to Trash</b> &nbsp;
              <span className="s">legacy-dashboard</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
