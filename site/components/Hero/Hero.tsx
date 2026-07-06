import { Icon } from "@/components/Icon";
import { Btn } from "@/components/Btn";
import { Eyebrow } from "@/components/Eyebrow";
import { Wrap } from "@/components/Wrap";
import { HeroScene } from "./HeroScene";
import { REPO_URL, DOWNLOAD_URL } from "@/lib/links";

export function Hero() {
  return (
    <section className="relative pt-[78px] text-center">
      <Wrap>
        <Eyebrow className="reveal">macOS menu bar app · free scan</Eyebrow>
        <h1 className="reveal d1 mx-auto mt-[22px] max-w-[16ch] font-display text-[clamp(40px,6.4vw,78px)] font-extrabold leading-[0.98] tracking-[-0.03em]">
          A <span className="text-accent">tidy disk</span>, without thinking
          about it.
        </h1>
        <p className="reveal d2 mx-auto mt-6 max-w-[600px] text-[19px] leading-[1.55] text-ink-2 [&_code]:border-[rgba(255,99,99,0.18)] [&_code]:bg-[rgba(255,99,99,0.08)] [&_code]:text-accent">
          Dev work quietly eats your Mac: old projects, heavy dependencies,
          forgotten experiments. TidyDisk watches from the menu bar and gives
          the space back in one click. Safely, to the Trash, never{" "}
          <code>rm -rf</code>.
        </p>
        <div className="reveal d2 mt-[34px] flex flex-wrap justify-center gap-[14px]">
          <Btn variant="primary" size="lg" href={DOWNLOAD_URL} target="_blank" rel="noopener">
            <Icon id="i-download" />
            Download for macOS
          </Btn>
          <Btn variant="ghost" size="lg" href={REPO_URL} target="_blank" rel="noopener">
            <Icon id="i-github" />
            View on GitHub
          </Btn>
        </div>
        <div className="reveal d3 mt-[18px] font-mono text-[13.5px] text-ink-3">
          MIT-licensed · macOS 13+ · Apple Silicon &amp; Intel
        </div>
      </Wrap>

      <HeroScene />
    </section>
  );
}
