import { Icon } from "@/components/Icon";
import { GRID_CARDS } from "./FeatureGrid.constants";

const DELAY = ["", " d1", " d2"];

export function FeatureGrid() {
  return (
    <section className="lp-grid-sec">
      <div className="wrap">
        <div className="lp-section-head reveal">
          <div className="lp-kicker">Everything in one menu</div>
          <h2 className="lp-h2">
            Small app. <span className="accent">Big relief.</span>
          </h2>
          <p className="lp-lead">
            No accounts, no cloud, nothing leaves your Mac. Just a quiet utility
            that keeps your disk honest.
          </p>
        </div>
        <div className="lp-grid">
          {GRID_CARDS.map((card, i) => (
            <div key={card.title} className={`lp-gcard reveal${DELAY[i % 3]}`}>
              <div className="gi">
                <Icon id={card.icon} />
              </div>
              <h4>{card.title}</h4>
              <p>{card.copy}</p>
            </div>
          ))}
        </div>
        <div className="lp-coming reveal">
          <span className="pill">Coming soon</span>
          <p>
            npm, yarn &amp; bun caches, plus per-project build outputs like{" "}
            <code>.next</code> and <code>dist</code>.
          </p>
        </div>
      </div>
    </section>
  );
}
