import { Icon } from "@/components/Icon";
import { Pixrow } from "@/components/Pixrow";
import { DOWNLOAD_URL, BUY_URL } from "@/lib/links";

export function FinalCta() {
  return (
    <section className="lp-final">
      <div className="wrap">
        <div className="lp-final-card reveal">
          <div className="glow" />
          <h2>
            Stop hoarding
            <br />
            node_modules.
          </h2>
          <p>
            Reclaim the gigabytes your dependencies have been hoarding. Scan
            free, unlock cleanup for 19 euros.
          </p>
          <div className="lp-cta-row">
            <a className="lp-btn lp-btn-primary lp-btn-lg" href={DOWNLOAD_URL} target="_blank" rel="noopener">
              <Icon id="i-download" />
              Download free scan
            </a>
            <a className="lp-btn lp-btn-ghost lp-btn-lg" href={BUY_URL}>
              <Icon id="i-sparkles" />
              Buy · €19
            </a>
          </div>
          <Pixrow
            className="mt-9 justify-center"
            cellClassName="h-[28px] w-[14px] rounded-[3px]"
          />
        </div>
      </div>
    </section>
  );
}
