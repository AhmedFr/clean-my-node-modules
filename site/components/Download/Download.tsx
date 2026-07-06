import type { ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { Btn } from "@/components/Btn";
import { Wrap } from "@/components/Wrap";
import { SectionHead } from "@/components/SectionHead";
import { DOWNLOAD_URL, BUY_URL } from "@/lib/links";
import type { Dictionary } from "@/lib/i18n";

function Li({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-[10px] text-[15px] text-ink-2">
      <span className="mt-px grid h-[19px] w-[19px] flex-none place-items-center rounded-[5px] bg-[rgba(255,99,99,0.16)] text-accent [&_svg]:h-3 [&_svg]:w-3">
        <Icon id="i-check" />
      </span>
      {children}
    </li>
  );
}

export interface DownloadProps {
  dict: Dictionary;
}

export function Download({ dict }: DownloadProps) {
  const download = dict.download;
  const { free, pro } = download;
  return (
    <section className="relative pt-[120px]" id="download">
      <Wrap>
        <SectionHead
          kicker={download.kicker}
          heading={download.heading}
          lead={download.lead}
        />
        <div className="mx-auto mt-[54px] grid max-w-[840px] grid-cols-2 gap-5 max900:grid-cols-1">
          <div className="reveal flex flex-col rounded-[18px] border border-line bg-white/[0.025] p-8">
            <div className="font-display text-[22px] font-bold">{free.name}</div>
            <div className="mt-[5px] text-[14.5px] text-ink-3">{free.desc}</div>
            <ul className="mb-[26px] mt-5 flex flex-1 flex-col gap-[11px]">
              {free.bullets.map((bullet, i) => (
                <Li key={i}>{bullet}</Li>
              ))}
            </ul>
            <Btn
              variant="ghost"
              className="justify-center"
              href={DOWNLOAD_URL}
              target="_blank"
              rel="noopener"
            >
              <Icon id="i-download" />
              {free.cta}
            </Btn>
          </div>
          <div className="reveal d1 relative flex flex-col rounded-[18px] border border-[rgba(255,99,99,0.45)] bg-[linear-gradient(180deg,rgba(255,99,99,0.08),rgba(255,255,255,0.02))] p-8">
            <span className="absolute right-[18px] top-[18px] rounded-full border border-[rgba(255,99,99,0.3)] bg-[rgba(255,99,99,0.14)] px-[10px] py-1 font-mono text-[11px] uppercase tracking-[0.05em] text-accent">
              {pro.badge}
            </span>
            <div className="font-display text-[22px] font-bold">{pro.name}</div>
            <div className="mt-[5px] text-[14.5px] text-ink-3">{pro.desc}</div>
            <ul className="mb-[26px] mt-5 flex flex-1 flex-col gap-[11px]">
              {pro.bullets.map((bullet, i) => (
                <Li key={i}>{bullet}</Li>
              ))}
            </ul>
            <Btn variant="primary" className="justify-center" href={BUY_URL}>
              <Icon id="i-sparkles" />
              {pro.cta}
            </Btn>
          </div>
        </div>
      </Wrap>
    </section>
  );
}
