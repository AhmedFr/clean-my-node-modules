import { Icon } from "@/components/Icon";

function Stack({ n, className }: { n: number; className?: string }) {
  return (
    <div className={className ? `ex-stack ${className}` : "ex-stack"}>
      {Array.from({ length: n }, (_, i) => (
        <i key={i} />
      ))}
    </div>
  );
}

export function WhyLifecycle() {
  return (
    <section className="lp-explain-sec" id="why">
      <div className="wrap">
        <div className="lp-section-head reveal">
          <div className="lp-kicker">Why it piles up</div>
          <h2 className="lp-h2">
            The <span className="accent">node_modules</span> lifecycle.
          </h2>
          <p className="lp-lead">
            Every install writes your dependencies to disk. How much they pile
            up, and how much you can win back, comes down to your package
            manager.
          </p>
        </div>

        <div className="lp-explain">
          {/* npm / yarn: a full copy per project */}
          <div className="ex-col reveal">
            <div className="ex-head">
              <span className="ex-pm">
                npm <span className="muted">· yarn</span>
              </span>
              <span className="ex-tag warn">a full copy per project</span>
            </div>
            <div className="ex-diagram" aria-hidden>
              <div className="ex-proj">
                <span className="ex-pl">app-one</span>
                <Stack n={5} />
              </div>
              <div className="ex-proj">
                <span className="ex-pl">app-two</span>
                <Stack n={5} />
              </div>
              <div className="ex-proj">
                <span className="ex-pl">app-three</span>
                <Stack n={5} />
              </div>
            </div>
            <p className="ex-note">
              Each project gets its <b>own full copy</b> of every dependency.
              Install <code>lodash</code> in ten projects and it&apos;s written
              to disk <b>ten times</b>. Multiply that across hundreds of
              transitive packages and the old projects you forgot about, and
              you&apos;re tens of gigabytes deep.
            </p>
          </div>

          {/* pnpm: one shared store */}
          <div className="ex-col reveal d1">
            <div className="ex-head">
              <span className="ex-pm pnpm">pnpm</span>
              <span className="ex-tag good">one shared store</span>
            </div>
            <div className="ex-diagram pnpm" aria-hidden>
              <div className="ex-projrow">
                <div className="ex-proj thin">
                  <span className="ex-pl">app-one</span>
                  <Stack n={2} className="thin" />
                </div>
                <div className="ex-proj thin">
                  <span className="ex-pl">app-two</span>
                  <Stack n={2} className="thin" />
                </div>
                <div className="ex-proj thin">
                  <span className="ex-pl">app-three</span>
                  <Stack n={2} className="thin" />
                </div>
              </div>
              <div className="ex-links">
                <span />
                <span />
                <span />
              </div>
              <div className="ex-store">
                <span className="ex-sl">~/.pnpm-store · stored once</span>
                <Stack n={5} className="store" />
              </div>
            </div>
            <p className="ex-note">
              pnpm keeps <b>one global store</b> and hard-links each project into
              it. A given version of a package lives on disk <b>once</b>, no
              matter how many projects use it, a huge saving.{" "}
              <b>But the store still grows</b> as new versions land and old ones
              linger.
            </p>
          </div>
        </div>

        <div className="lp-explain-foot reveal">
          <span className="ck">
            <Icon id="i-check" />
          </span>
          <p>
            TidyDisk works <b>both ends</b>: it trashes the stale
            project <code>node_modules</code> you&apos;ll never{" "}
            <code>npm install</code> again, <b>and</b> safely prunes your pnpm
            store of versions nothing links to anymore, one click in the{" "}
            <b>Caches</b> tab (it never deletes the store itself).
          </p>
        </div>

        <p className="lp-explain-note reveal">
          It&apos;s also why sizes look small on pnpm: TidyDisk counts the
          shared store <b>once</b> and shows you what&apos;s really
          yours to free, not the same bytes linked into a dozen projects.
        </p>
      </div>
    </section>
  );
}
