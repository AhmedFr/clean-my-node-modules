import type { ReactNode } from "react";
import { Wrap } from "@/components/Wrap";
import { SectionHead } from "@/components/SectionHead";
import type { Dictionary } from "@/lib/i18n";

const DELAY = ["", " d1", " d2"];

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

export interface HowItWorksProps {
  dict: Dictionary;
}

export function HowItWorks({ dict }: HowItWorksProps) {
  const how = dict.how;
  return (
    <section className="relative pt-[120px]" id="how">
      <Wrap>
        <SectionHead kicker={how.kicker} heading={how.heading} />
        <div className="mt-[54px] grid grid-cols-3 gap-[22px] max900:grid-cols-1">
          {how.steps.map((step, i) => (
            <Step
              key={step.num}
              delay={DELAY[i]}
              num={step.num}
              title={step.title}
              body={step.body}
              cmd={step.cmd}
            />
          ))}
        </div>
      </Wrap>
    </section>
  );
}
