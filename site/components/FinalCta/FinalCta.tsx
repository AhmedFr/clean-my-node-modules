import { Icon } from "@/components/Icon";
import { Pixrow } from "@/components/Pixrow";
import { REPO_URL, DOWNLOAD_URL } from "@/lib/links";

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
            Reclaim the gigabytes node_modules has been hoarding. Download it
            free, or build it yourself. It&apos;s all on GitHub.
          </p>
          <div className="lp-cta-row">
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
          <Pixrow />
        </div>
      </div>
    </section>
  );
}
