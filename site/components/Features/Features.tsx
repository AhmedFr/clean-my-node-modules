import { Wrap } from "@/components/Wrap";
import { FeatureRow } from "./FeatureRow";
import { NotifVisual } from "./NotifVisual";
import { LauncherVisual } from "./LauncherVisual";
import { ReclaimVisual } from "./ReclaimVisual";
import { PackagesVisual } from "./PackagesVisual";
import type { Dictionary } from "@/lib/i18n";

export interface FeaturesProps {
  dict: Dictionary;
}

export function Features({ dict }: FeaturesProps) {
  const [notif, launcher, reclaim, packages] = dict.features;
  return (
    <section className="relative pt-[100px]" id="features">
      <Wrap className="flex flex-col gap-[150px] max900:gap-[96px]">
        <FeatureRow
          num="01"
          tagline={notif.tagline}
          heading={notif.heading}
          body={notif.body}
          bullets={notif.bullets}
          visual={<NotifVisual />}
        />
        <FeatureRow
          flip
          num="02"
          tagline={launcher.tagline}
          heading={launcher.heading}
          body={launcher.body}
          bullets={launcher.bullets}
          visual={<LauncherVisual />}
        />
        <FeatureRow
          num="03"
          tagline={reclaim.tagline}
          heading={reclaim.heading}
          body={reclaim.body}
          bullets={reclaim.bullets}
          visual={<ReclaimVisual />}
        />
        <FeatureRow
          flip
          id="packages"
          num="04"
          tagline={packages.tagline}
          heading={packages.heading}
          body={packages.body}
          bullets={packages.bullets}
          visual={<PackagesVisual />}
        />
      </Wrap>
    </section>
  );
}
