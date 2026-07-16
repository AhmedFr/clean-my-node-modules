import { Wrap } from "@/components/Wrap";
import type { LegalArticleProps } from "./LegalArticle.types";

// Presentational renderer for a legal document (privacy policy or imprint).
// Locale-agnostic: it takes an already-resolved LegalDoc plus the localized
// "last updated" label and date. The optional children slot renders between
// the intro and the sections (used for the imprint identity card).
export function LegalArticle({
  doc,
  updatedLabel,
  updated,
  children,
}: LegalArticleProps) {
  return (
    <main id="top" className="pb-24 pt-14 max560:pt-10">
      <Wrap className="max-w-[760px]">
        <h1 className="font-display text-[40px] font-extrabold leading-[1.1] tracking-[-0.02em] max560:text-[30px]">
          {doc.title}
        </h1>
        <p className="mt-3 font-mono text-[13px] text-ink-4">
          {updatedLabel}: {updated}
        </p>
        <p className="mt-6 text-[17px] leading-relaxed text-ink-2">
          {doc.intro}
        </p>

        {children}

        <div className="mt-10 flex flex-col gap-9">
          {doc.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="mb-3 font-display text-[21px] font-bold tracking-[-0.01em]">
                {section.heading}
              </h2>
              {section.paragraphs?.map((paragraph, i) => (
                <p
                  key={i}
                  className="mb-3 text-[15.5px] leading-relaxed text-ink-2 last:mb-0"
                >
                  {paragraph}
                </p>
              ))}
              {section.bullets && (
                <ul className="mt-2 flex list-disc flex-col gap-2 pl-5 text-[15.5px] leading-relaxed text-ink-2 marker:text-ink-4">
                  {section.bullets.map((bullet, i) => (
                    <li key={i}>{bullet}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </Wrap>
    </main>
  );
}
