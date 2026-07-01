import { Icon } from "@/components/Icon";
import { PixelMeter } from "@/components/PixelMeter";

function Check() {
  return (
    <span className="ck">
      <Icon id="i-check" />
    </span>
  );
}

export function Features() {
  return (
    <section className="lp-features" id="features">
      <div className="wrap">
        {/* feature 1 */}
        <div className="lp-feature">
          <div className="lp-feat-text reveal">
            <span className="tag">
              <span className="n">01</span>Always watching
            </span>
            <h3>It watches your disk so you don&apos;t have to.</h3>
            <p>
              Clean my node_modules lives in your menu bar and rescans on your
              schedule — every 6 hours, daily, or weekly. A native notification
              slides in the moment your node_modules cross the limit you set.
            </p>
            <ul className="lp-feat-list">
              <li>
                <Check />
                Background scans every 6 hours, daily, or weekly
              </li>
              <li>
                <Check />A threshold you set, in plain gigabytes
              </li>
              <li>
                <Check />
                One glance at the menu bar tells you where you stand
              </li>
            </ul>
          </div>
          <div className="lp-feat-visual reveal d1">
            <div className="lp-vis-glow" />
            <div className="lp-vis-card">
              <div className="notif glass-panel">
                <span className="nico">
                  <Icon id="i-alert" />
                </span>
                <div className="nbody">
                  <div className="nhead">
                    <span className="app">Clean my node_modules</span>
                    <span className="t">now</span>
                  </div>
                  <div className="ntext">
                    You&apos;ve crossed your limit —{" "}
                    <b style={{ color: "#fff" }}>5.42 GB</b> of stale
                    dependencies are taking up space.
                  </div>
                  <div className="nbtns">
                    <button className="prim">Review &amp; clean</button>
                    <button className="sec">Later</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* feature 2 */}
        <div className="lp-feature flip">
          <div className="lp-feat-text reveal">
            <span className="tag">
              <span className="n">02</span>Total clarity
            </span>
            <h3>Every dead dependency, ranked.</h3>
            <p>
              Open the full launcher for a deep clean. Spotlight-style search
              across project names and paths, with every node_modules folder
              showing its real size and how long it&apos;s been since you touched
              it — the biggest, stalest offenders rise to the top.
            </p>
            <ul className="lp-feat-list">
              <li>
                <Check />
                Sort by last used, size, or project name
              </li>
              <li>
                <Check />
                Full keyboard navigation — ↑↓ to move, ↵ to open, ⌘⌫ to delete
              </li>
              <li>
                <Check />
                On pnpm, the real bytes you&apos;d free — apart from what&apos;s
                linked into the shared store
              </li>
              <li>
                <Check />
                Reveal in Finder or open in your editor, one key away
              </li>
            </ul>
          </div>
          <div className="lp-feat-visual reveal d1">
            <div className="lp-vis-glow" />
            <div className="lp-vis-card">
              <div className="launcher glass-panel">
                <div className="lh">
                  <span className="ico">
                    <Icon id="logo-module" />
                  </span>
                  <span className="q">
                    Search node_modules by project or path…
                  </span>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 9 }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 650,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      5.42 GB
                    </span>
                    <PixelMeter
                      used={5.42}
                      threshold={5}
                      cells={16}
                      className="sm"
                      style={{ width: 120 }}
                    />
                  </div>
                </div>
                <div className="ui-sep" />
                <div className="listhead">
                  <span className="l">12 folders · reclaimable</span>
                  <div className="sortbtns">
                    <span className="on">Last used</span>
                    <span>Size</span>
                    <span>Name</span>
                  </div>
                </div>
                <div className="ui-rows">
                  <div className="ui-row hl">
                    <svg className="fw" viewBox="0 0 24 24">
                      <use href="#fw-react" />
                    </svg>
                    <div className="meta">
                      <div className="nm">legacy-dashboard</div>
                      <div className="sub pathmono">
                        ~/Code/clients/acme/legacy-dashboard
                      </div>
                    </div>
                    <div className="age">1 year ago</div>
                    <div className="sz">
                      612<span className="u">MB</span>
                    </div>
                  </div>
                  <div className="ui-row">
                    <svg className="fw" viewBox="0 0 24 24">
                      <use href="#fw-vue" />
                    </svg>
                    <div className="meta">
                      <div className="nm">portfolio-2021</div>
                      <div className="sub pathmono">~/Sites/portfolio-2021</div>
                    </div>
                    <div className="age">1 year ago</div>
                    <div className="sz">
                      284<span className="u">MB</span>
                    </div>
                  </div>
                  <div className="ui-row">
                    <svg className="fw" viewBox="0 0 24 24">
                      <use href="#fw-node" />
                    </svg>
                    <div className="meta">
                      <div className="nm">hackathon-bot</div>
                      <div className="sub pathmono">
                        ~/Code/experiments/hackathon-bot
                      </div>
                    </div>
                    <div className="age">9 months ago</div>
                    <div className="sz">
                      441<span className="u">MB</span>
                    </div>
                  </div>
                  <div className="ui-row">
                    <svg className="fw" viewBox="0 0 24 24">
                      <use href="#fw-expo" />
                    </svg>
                    <div className="meta">
                      <div className="nm">recipe-app-old</div>
                      <div className="sub pathmono">
                        ~/Code/personal/recipe-app-old
                      </div>
                    </div>
                    <div className="age">7 months ago</div>
                    <div className="sz">
                      903<span className="u">MB</span>
                    </div>
                  </div>
                  <div className="ui-row">
                    <svg className="fw" viewBox="0 0 24 24">
                      <use href="#fw-next" />
                    </svg>
                    <div className="meta">
                      <div className="nm">marketing-site</div>
                      <div className="sub pathmono">~/Work/marketing-site</div>
                    </div>
                    <div className="age">4 months ago</div>
                    <div className="sz">
                      538<span className="u">MB</span>
                    </div>
                  </div>
                  <div className="ui-row">
                    <svg className="fw" viewBox="0 0 24 24">
                      <use href="#fw-svelte" />
                    </svg>
                    <div className="meta">
                      <div className="nm">svelte-playground</div>
                      <div className="sub pathmono">
                        ~/Code/experiments/svelte-playground
                      </div>
                    </div>
                    <div className="age">2 months ago</div>
                    <div className="sz">
                      209<span className="u">MB</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* feature 3 */}
        <div className="lp-feature">
          <div className="lp-feat-text reveal">
            <span className="tag">
              <span className="n">03</span>Safe payoff
            </span>
            <h3>One click. Gigabytes back. Nothing lost.</h3>
            <p>
              Pick what you don&apos;t need and it goes to the Trash — no
              terminal, no <code>rm -rf</code> roulette, recoverable until you
              empty it. Watch the meter drop and your free space climb. Need a
              project again? A single <code>npm install</code> brings it right
              back.
            </p>
            <ul className="lp-feat-list">
              <li>
                <Check />
                Deletes to the Trash — recoverable, never <code>rm -rf</code>
              </li>
              <li>
                <Check />
                Delete one folder or sweep all the stale ones at once
              </li>
              <li>
                <Check />
                Only ever touches node_modules — never your source
              </li>
            </ul>
          </div>
          <div className="lp-feat-visual reveal d1">
            <div className="lp-vis-glow" />
            <div className="lp-vis-card">
              <div className="reclaim">
                <div className="ba">
                  <div className="lab">
                    <span className="k">Before</span>
                    <span className="v" style={{ color: "var(--accent)" }}>
                      5.42 GB
                    </span>
                  </div>
                  <PixelMeter
                    used={5.42}
                    threshold={5}
                    cells={20}
                    className="sm"
                  />
                </div>
                <div className="arrow">
                  <Icon id="i-arrow-down" />
                </div>
                <div className="ba">
                  <div className="lab">
                    <span className="k">After</span>
                    <span className="v" style={{ color: "var(--green)" }}>
                      2.71 GB
                    </span>
                  </div>
                  <PixelMeter
                    used={2.71}
                    threshold={5}
                    cells={20}
                    className="sm"
                  />
                </div>
                <div className="saved">+ 2.71 GB reclaimed in one sweep</div>
              </div>
            </div>
          </div>
        </div>

        {/* feature 4 — the Packages tab */}
        <div className="lp-feature flip" id="packages">
          <div className="lp-feat-text reveal">
            <span className="tag">
              <span className="n">04</span>Whole-machine view
            </span>
            <h3>Every package you&apos;ve installed — in one list.</h3>
            <p>
              Open the Packages tab for a computer-wide inventory of every
              dependency your projects pull in: how many use it, its size, the
              versions you&apos;re on, the latest on npm, and any security
              advisories. Spot the heavy and unused, unify versions that have
              drifted apart, and see what&apos;s flagged — all from projects
              you&apos;ve already scanned.
            </p>
            <ul className="lp-feat-list">
              <li>
                <Check />
                How many projects use each package — and its real size
              </li>
              <li>
                <Check />A <b>unify</b> badge when one package is installed at
                several versions
              </li>
              <li>
                <Check />
                Latest-on-npm and security-advisory pills — expand a row for
                per-version severity
              </li>
            </ul>
          </div>
          <div className="lp-feat-visual reveal d1">
            <div className="lp-vis-glow" />
            <div className="lp-vis-card">
              <div className="packages glass-panel">
                <div className="lh">
                  <span className="ico">
                    <Icon id="logo-module" />
                  </span>
                  <div className="tabs">
                    <span>Projects</span>
                    <span>Caches</span>
                    <span className="on">Packages</span>
                  </div>
                </div>
                <div className="ui-sep" />
                <div className="listhead">
                  <span className="l">142 packages · whole machine</span>
                  <div className="sortbtns">
                    <span className="on">Used</span>
                    <span>Size</span>
                    <span>Updates</span>
                  </div>
                </div>
                <div className="ui-rows">
                  <div className="ui-row pkg hl">
                    <span className="pico">
                      <Icon id="i-box" />
                    </span>
                    <div className="meta">
                      <div className="nm">lodash</div>
                      <div className="sub">14 projects · 3 versions</div>
                    </div>
                    <div className="pright">
                      <span className="pill unify">unify</span>
                      <span className="sz">
                        22<span className="u">MB</span>
                      </span>
                    </div>
                  </div>
                  <div className="ui-row pkg">
                    <span className="pico">
                      <Icon id="i-box" />
                    </span>
                    <div className="meta">
                      <div className="nm">typescript</div>
                      <div className="sub">9 projects · v5.4.2</div>
                    </div>
                    <div className="pright">
                      <span className="pill upd">↑ 5.7.2</span>
                      <span className="sz">
                        61<span className="u">MB</span>
                      </span>
                    </div>
                  </div>
                  <div className="ui-row pkg">
                    <span className="pico sev">
                      <Icon id="i-shield" />
                    </span>
                    <div className="meta">
                      <div className="nm">minimatch</div>
                      <div className="sub">6 projects · v3.0.4</div>
                    </div>
                    <div className="pright">
                      <span className="pill sev">
                        <Icon id="i-alert" />
                        high
                      </span>
                      <span className="sz">
                        480<span className="u">KB</span>
                      </span>
                    </div>
                  </div>
                  <div className="ui-row pkg">
                    <span className="pico">
                      <Icon id="i-box" />
                    </span>
                    <div className="meta">
                      <div className="nm">react</div>
                      <div className="sub">11 projects · v18.3.1</div>
                    </div>
                    <div className="pright">
                      <span className="sz">
                        3.4<span className="u">MB</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
