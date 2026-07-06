import { Wrap } from "@/components/Wrap";
import { FeatureRow } from "./FeatureRow";
import { NotifVisual } from "./NotifVisual";
import { LauncherVisual } from "./LauncherVisual";
import { ReclaimVisual } from "./ReclaimVisual";
import { PackagesVisual } from "./PackagesVisual";

export function Features() {
  return (
    <section className="relative pt-[100px]" id="features">
      <Wrap className="flex flex-col gap-[150px] max900:gap-[96px]">
        <FeatureRow
          num="01"
          tagline="Always watching"
          heading="It watches your disk so you don't have to."
          body="TidyDisk lives in your menu bar and rescans on your schedule: every 6 hours, daily, or weekly. A native notification slides in the moment your node_modules cross the limit you set."
          bullets={[
            "Background scans every 6 hours, daily, or weekly",
            "A threshold you set, in plain gigabytes",
            "One glance at the menu bar tells you where you stand",
          ]}
          visual={<NotifVisual />}
        />
        <FeatureRow
          flip
          num="02"
          tagline="Total clarity"
          heading="Every dead dependency, ranked."
          body="Open the full launcher for a deep clean. Spotlight-style search across project names and paths, with every node_modules folder showing its real size and how long it's been since you touched it. The biggest, stalest offenders rise to the top."
          bullets={[
            "Sort by last used, size, or project name",
            "Full keyboard navigation: ↑↓ to move, ↵ to open, ⌘⌫ to delete",
            "On pnpm, the real bytes you'd free, apart from what's linked into the shared store",
            "Reveal in Finder or open in your editor, one key away",
          ]}
          visual={<LauncherVisual />}
        />
        <FeatureRow
          num="03"
          tagline="Safe payoff"
          heading="One click. Gigabytes back. Nothing lost."
          body={
            <>
              Pick what you don&apos;t need and it goes to the Trash. No
              terminal, no <code>rm -rf</code> roulette, recoverable until you
              empty it. Watch the meter drop and your free space climb. Need a
              project again? A single <code>npm install</code> brings it right
              back.
            </>
          }
          bullets={[
            <>
              Deletes to the Trash: recoverable, never <code>rm -rf</code>
            </>,
            "Delete one folder or sweep all the stale ones at once",
            "Only ever touches node_modules, never your source",
          ]}
          visual={<ReclaimVisual />}
        />
        <FeatureRow
          flip
          id="packages"
          num="04"
          tagline="Whole-machine view"
          heading="Every package you've installed, in one list."
          body="Open the Packages tab for a computer-wide inventory of every dependency your projects pull in: how many use it, its size, the versions you're on, the latest on npm, and any security advisories. Spot the heavy and unused, unify versions that have drifted apart, and see what's flagged, all from projects you've already scanned."
          bullets={[
            "How many projects use each package, and its real size",
            <>
              A <b>unify</b> badge when one package is installed at several
              versions
            </>,
            "Latest-on-npm and security-advisory pills. Expand a row for per-version severity",
          ]}
          visual={<PackagesVisual />}
        />
      </Wrap>
    </section>
  );
}
