import { Icon } from "@/components/Icon";
import { AppPanel } from "@/components/AppPanel";
import { REPO_URL, DOWNLOAD_URL } from "@/lib/links";

export function Hero() {
  return (
    <section className="lp-hero">
      <div className="wrap">
        <div className="lp-eyebrow reveal">
          <span className="dot" />
          macOS menu bar app · free scan
        </div>
        <h1 className="lp-h1 reveal d1">
          A <span className="accent word">tidy disk</span>, without thinking
          about it.
        </h1>
        <p className="lp-sub reveal d2">
          Dev work quietly eats your Mac: old projects, heavy dependencies,
          forgotten experiments. TidyDisk watches from the menu bar and gives
          the space back in one click. Safely, to the Trash, never{" "}
          <code>rm -rf</code>.
        </p>
        <div className="lp-cta-row reveal d2">
          <a className="lp-btn lp-btn-primary lp-btn-lg" href={DOWNLOAD_URL} target="_blank" rel="noopener">
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

          {/* dropdown: recreation of the real menu-bar panel */}
          <div className="scene-dropdown glass-panel">
            <AppPanel />
          </div>

          {/* floating Packages card: the new whole-machine inventory */}
          <div className="scene-packages glass-panel">
            <div className="sp-head">
              <span className="sp-title">
                <Icon id="i-box" />
                Packages
              </span>
              <span className="sp-count">6 in use</span>
            </div>
            <div className="ui-sep" />
            <div className="ui-rows">
              <div className="ui-row pkg">
                <span className="pico">
                  <Icon id="i-box" />
                </span>
                <div className="meta">
                  <div className="nm">lodash</div>
                  <div className="sub">12 projects · 2 versions</div>
                </div>
                <div className="pright">
                  <span className="pill unify">unify</span>
                  <span className="sz">
                    18<span className="u">MB</span>
                  </span>
                </div>
              </div>
              <div className="ui-row pkg">
                <span className="pico">
                  <Icon id="i-box" />
                </span>
                <div className="meta">
                  <div className="nm">next</div>
                  <div className="sub">5 projects · v14.2.3</div>
                </div>
                <div className="pright">
                  <span className="pill upd">↑ 15.0.1</span>
                  <span className="sz">
                    128<span className="u">MB</span>
                  </span>
                </div>
              </div>
              <div className="ui-row pkg">
                <span className="pico sev">
                  <Icon id="i-shield" />
                </span>
                <div className="meta">
                  <div className="nm">minimatch</div>
                  <div className="sub">3 projects · v3.0.4</div>
                </div>
                <div className="pright">
                  <span className="pill sev">
                    <Icon id="i-alert" />
                    high
                  </span>
                  <span className="sz">
                    512<span className="u">KB</span>
                  </span>
                </div>
              </div>
            </div>
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
