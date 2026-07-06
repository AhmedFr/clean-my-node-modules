import { Icon } from "@/components/Icon";
import { Wrap } from "@/components/Wrap";
import { SectionHead } from "@/components/SectionHead";

// The npm diagram repeats the SAME palette per project = duplication story.
const STACK_PALETTE = [
  { color: "#ff6363", flex: 1.4 },
  { color: "#6ca0f0", flex: 1 },
  { color: "#34d399", flex: 1.7 },
  { color: "#f5b14c", flex: 0.8 },
  { color: "#b58af0", flex: 1.2 },
];

function Stack({ variant = "full" }: { variant?: "full" | "thin" | "store" }) {
  if (variant === "thin") {
    return (
      <div className="flex gap-[3px]">
        {Array.from({ length: 2 }, (_, i) => (
          <i key={i} className="h-[9px] flex-1 rounded-[3px] bg-ink-4 opacity-50" />
        ))}
      </div>
    );
  }
  return (
    <div className="flex gap-1">
      {STACK_PALETTE.map((cell, i) => (
        <i
          key={i}
          className={`rounded-[4px] opacity-[0.92] ${variant === "store" ? "h-[26px]" : "h-[22px]"}`}
          style={{ background: cell.color, flex: cell.flex }}
        />
      ))}
    </div>
  );
}

const NOTE =
  "mt-[18px] text-[14.5px] leading-[1.6] text-ink-2 [&_b]:font-semibold [&_b]:text-ink";

export function WhyLifecycle() {
  return (
    <section className="relative pt-[120px]" id="why">
      <Wrap>
        <SectionHead
          kicker="Why it piles up"
          heading={
            <>
              The <span className="text-accent">node_modules</span> lifecycle.
            </>
          }
          lead="Every install writes your dependencies to disk. How much they pile up, and how much you can win back, comes down to your package manager."
        />

        <div className="mt-[54px] grid grid-cols-2 items-stretch gap-5 max900:grid-cols-1">
          {/* npm / yarn: a full copy per project */}
          <div className="reveal flex flex-col rounded-[18px] border border-line bg-white/[0.025] px-[26px] pb-7 pt-[26px]">
            <div className="mb-5 flex items-center justify-between gap-3">
              <span className="font-mono text-[17px] font-semibold tracking-[-0.01em] text-ink">
                npm <span className="font-medium text-ink-4">· yarn</span>
              </span>
              <span className="whitespace-nowrap rounded-full border border-[rgba(255,99,99,0.22)] bg-[rgba(255,99,99,0.10)] px-[11px] py-[5px] text-[11.5px] font-semibold text-accent">
                a full copy per project
              </span>
            </div>
            <div
              className="flex min-h-[206px] flex-col justify-center gap-[13px] rounded-[13px] border border-line bg-black/22 p-4"
              aria-hidden
            >
              {["app-one", "app-two", "app-three"].map((name) => (
                <div key={name}>
                  <span className="mb-[5px] block font-mono text-[11px] text-ink-3">
                    {name}
                  </span>
                  <Stack />
                </div>
              ))}
            </div>
            <p className={NOTE}>
              Each project gets its <b>own full copy</b> of every dependency.
              Install <code>lodash</code> in ten projects and it&apos;s written
              to disk <b>ten times</b>. Multiply that across hundreds of
              transitive packages and the old projects you forgot about, and
              you&apos;re tens of gigabytes deep.
            </p>
          </div>

          {/* pnpm: one shared store */}
          <div className="reveal d1 flex flex-col rounded-[18px] border border-line bg-white/[0.025] px-[26px] pb-7 pt-[26px]">
            <div className="mb-5 flex items-center justify-between gap-3">
              <span className="font-mono text-[17px] font-semibold tracking-[-0.01em] text-accent">
                pnpm
              </span>
              <span className="whitespace-nowrap rounded-full border border-[rgba(52,211,153,0.24)] bg-[rgba(52,211,153,0.10)] px-[11px] py-[5px] text-[11.5px] font-semibold text-ok">
                one shared store
              </span>
            </div>
            <div
              className="flex min-h-[206px] flex-col justify-between rounded-[13px] border border-line bg-black/22 p-4"
              aria-hidden
            >
              <div className="grid grid-cols-3 gap-[10px]">
                {["app-one", "app-two", "app-three"].map((name) => (
                  <div key={name}>
                    <span className="mb-[5px] block font-mono text-[11px] text-ink-3">
                      {name}
                    </span>
                    <Stack variant="thin" />
                  </div>
                ))}
              </div>
              <div className="grid h-6 grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="relative before:absolute before:bottom-0 before:left-1/2 before:top-0 before:w-[2px] before:-translate-x-1/2 before:bg-[repeating-linear-gradient(180deg,var(--color-accent)_0_3px,transparent_3px_7px)] before:opacity-55 before:content-['']"
                  />
                ))}
              </div>
              <div className="rounded-[10px] border border-[rgba(255,99,99,0.35)] bg-[rgba(255,99,99,0.05)] px-3 pb-3 pt-[11px]">
                <span className="mb-[7px] block font-mono text-[11px] text-accent">
                  ~/.pnpm-store · stored once
                </span>
                <Stack variant="store" />
              </div>
            </div>
            <p className={NOTE}>
              pnpm keeps <b>one global store</b> and hard-links each project
              into it. A given version of a package lives on disk <b>once</b>,
              no matter how many projects use it, a huge saving.{" "}
              <b>But the store still grows</b> as new versions land and old
              ones linger.
            </p>
          </div>
        </div>

        <div className="reveal mx-auto mt-[30px] flex max-w-[840px] items-start gap-[13px] rounded-[14px] border border-[rgba(52,211,153,0.18)] bg-[rgba(52,211,153,0.06)] px-[22px] py-[18px]">
          <span className="mt-px flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[rgba(52,211,153,0.16)] text-ok [&_svg]:h-[15px] [&_svg]:w-[15px]">
            <Icon id="i-check" />
          </span>
          <p className="text-[14.5px] leading-[1.6] text-ink-2 [&_b]:font-semibold [&_b]:text-ink">
            TidyDisk works <b>both ends</b>: it trashes the stale project{" "}
            <code>node_modules</code> you&apos;ll never <code>npm install</code>{" "}
            again, <b>and</b> safely prunes your pnpm store of versions nothing
            links to anymore, one click in the <b>Caches</b> tab (it never
            deletes the store itself).
          </p>
        </div>

        <p className="reveal mx-auto mt-[14px] max-w-[820px] text-center text-[13.5px] leading-[1.6] text-ink-3 [&_b]:font-semibold [&_b]:text-ink-2">
          It&apos;s also why sizes look small on pnpm: TidyDisk counts the
          shared store <b>once</b> and shows you what&apos;s really yours to
          free, not the same bytes linked into a dozen projects.
        </p>
      </Wrap>
    </section>
  );
}
