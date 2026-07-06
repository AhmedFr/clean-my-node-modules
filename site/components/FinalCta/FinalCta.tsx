import { Icon } from "@/components/Icon";
import { Btn } from "@/components/Btn";
import { Wrap } from "@/components/Wrap";
import { Pixrow } from "@/components/Pixrow";
import { DOWNLOAD_URL, BUY_URL } from "@/lib/links";

export function FinalCta() {
  return (
    <section className="relative pb-[120px] pt-[130px] text-center">
      <Wrap>
        <div className="reveal relative mx-auto max-w-[880px] overflow-hidden rounded-[26px] border border-line-2 bg-[radial-gradient(700px_360px_at_50%_0%,#34203a_0%,transparent_62%),linear-gradient(160deg,#1a1620,#0e0e12)] px-10 py-[70px] shadow-[0_50px_100px_-40px_rgba(0,0,0,0.8)]">
          <div className="absolute left-1/2 top-[-30%] z-0 h-[80%] w-[70%] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(255,99,99,0.3),transparent)] blur-[50px]" />
          <h2 className="relative z-[1] font-display text-[clamp(32px,5vw,56px)] font-extrabold leading-none tracking-[-0.03em]">
            Stop hoarding
            <br />
            node_modules.
          </h2>
          <p className="relative z-[1] mx-auto mt-[18px] max-w-[480px] text-[18px] text-ink-2">
            Reclaim the gigabytes your dependencies have been hoarding. Scan
            free, unlock cleanup for 19 euros.
          </p>
          <div className="relative z-[1] mt-8 flex flex-wrap justify-center gap-[14px]">
            <Btn variant="primary" size="lg" href={DOWNLOAD_URL} target="_blank" rel="noopener">
              <Icon id="i-download" />
              Download free scan
            </Btn>
            <Btn variant="ghost" size="lg" href={BUY_URL}>
              <Icon id="i-sparkles" />
              Buy · €19
            </Btn>
          </div>
          <Pixrow
            className="relative z-[1] mt-9 justify-center"
            cellClassName="h-[28px] w-[14px] rounded-[3px]"
          />
        </div>
      </Wrap>
    </section>
  );
}
