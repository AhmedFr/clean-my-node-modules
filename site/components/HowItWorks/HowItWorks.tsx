import type { ReactNode } from "react";
import { Wrap } from "@/components/Wrap";
import { SectionHead } from "@/components/SectionHead";

function Step({
  delay,
  num,
  title,
  body,
  cmd,
}: {
  delay?: string;
  num: string;
  title: ReactNode;
  body: ReactNode;
  cmd: ReactNode;
}) {
  return (
    <div
      className={`reveal${delay ?? ""} relative rounded-2xl border border-line bg-white/[0.025] px-[26px] py-[30px]`}
    >
      <div className="font-mono text-[13px] font-medium text-accent">{num}</div>
      <h4 className="mt-[14px] font-display text-[20px] font-bold tracking-[-0.01em]">
        {title}
      </h4>
      <p className="mt-[9px] text-[15px] text-ink-3">{body}</p>
      <div className="mt-4 flex items-center gap-2 rounded-[9px] border border-line bg-black/35 px-3 py-[9px] font-mono text-[13px] text-ink-2 [&_.pmt]:text-accent">
        {cmd}
      </div>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section className="relative pt-[120px]" id="how">
      <Wrap>
        <SectionHead
          kicker="How it works"
          heading={
            // prettier-ignore
            <>Three steps to a <span className="text-accent">lighter Mac.</span></>
          }
        />
        <div className="mt-[54px] grid grid-cols-3 gap-[22px] max900:grid-cols-1">
          <Step
            num="01"
            title={<>Get it &amp; it scans</>}
            body="Download the signed .app, or clone the repo and build your own. The first scan maps every node_modules folder on your disk."
            cmd={
              <>
                <span className="pmt">$</span>pnpm install &amp;&amp; pnpm
                package
              </>
            }
          />
          <Step
            delay=" d1"
            num="02"
            title="Set your limit"
            body="Pick a threshold in gigabytes and how often to rescan: every 6 hours, daily, or weekly. That's the entire setup."
            cmd={
              <>
                <span className="pmt">limit</span> 5 GB ·{" "}
                <span className="pmt">scan</span> daily
              </>
            }
          />
          <Step
            delay=" d2"
            num="03"
            title="Clean in a click"
            body="When you cross the line, review the stale folders (or prune the pnpm store, or audit a heavy package) and reclaim the space. Your disk thanks you."
            cmd={
              <>
                <span className="pmt">↵</span> 2.71 GB moved to Trash
              </>
            }
          />
        </div>
      </Wrap>
    </section>
  );
}
